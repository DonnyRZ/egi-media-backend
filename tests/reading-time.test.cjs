const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const reading = require('../src/helpers/utils/reading_time');

function domain(kind) {
  const file = path.join(__dirname, '../src/modules', kind, 'repositories/queries/domain.js');
  const sandbox = { module: { exports: {} }, require(name) {
    if (name === './query') return class Query {};
    if (name.endsWith('/reading_time')) return reading;
    if (name.endsWith('/crypto_helper')) return { decrypt: (value) => value };
    if (name.endsWith('/wrapper')) return { data: (data) => ({ data }), error: (err) => ({ err }) };
    if (name.endsWith('/logger')) return { error() {} };
    if (name.endsWith('/errors')) return { NotFoundError: Error, ForbiddenError: Error };
    throw new Error('Unexpected dependency: ' + name);
  } };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox);
  return new sandbox.module.exports({});
}

test('duration uses full visible text and Unicode words, excluding markup and executable/style content', () => {
  for (const word of ['kolaborasi', 'cooperation', 'O‘zbekiston']) {
    const content = `<style>${'ignored '.repeat(1000)}</style><script>${'ignored '.repeat(1000)}</script><!-- comment --><p>${(word + ' ').repeat(401)}</p>`;
    assert.equal(reading.calculateReadingTime(content), 3);
  }
  for (const content of [null, undefined, '', '<p>&nbsp;</p>', '<img src="x">']) assert.equal(reading.calculateReadingTime(content), null);
  assert.equal(reading.calculateReadingTime('word '.repeat(200)), 1);
  assert.equal(reading.calculateReadingTime('word '.repeat(201)), 2);
});

test('localized reading time follows rendered locale and falls back to full primary content', () => {
  const row = { reading_content: 'kata '.repeat(401), reading_content_en: 'word '.repeat(201), reading_content_uz: 'so‘z '.repeat(601) };
  assert.equal(reading.localizedReadingTime(row, 'id'), 3);
  assert.equal(reading.localizedReadingTime(row, 'en'), 2);
  assert.equal(reading.localizedReadingTime(row, 'uz'), 4);
  assert.equal(reading.localizedReadingTime({ ...row, reading_content_en: null }, 'en'), 3);
  assert.equal(reading.localizedReadingTime({ content: 'body '.repeat(401) }, 'en'), 3);
});

for (const kind of ['article', 'column']) {
  test(`${kind} DTO preserves full headline, hides internal body columns and never mutates content`, () => {
    const mapper = domain(kind);
    const row = { id: 'fixture', title: 'Complete headline '.repeat(40), title_en: 'English '.repeat(50), title_uz: 'O‘zbek '.repeat(50),
      slug: 'fixture', summary: 'Short teaser', author_id: 'author', author_full_name: 'Editor', category_id: 'category', category_name: 'Desk',
      reading_content: 'body '.repeat(401), reading_content_en: 'word '.repeat(201), reading_content_uz: 'so‘z '.repeat(601) };
    const before = JSON.stringify(row);
    for (const [locale, minutes] of [['id', 3], ['en', 2], ['uz', 4]]) {
      const dto = mapper.mapListItem(row, locale);
      assert.equal(dto.title, locale === 'id' ? row.title : row['title_' + locale]);
      assert.equal(dto.reading_time_minutes, minutes);
      assert.ok(!Object.keys(dto).some((key) => key.startsWith('reading_content') || key === 'content'));
    }
    assert.equal(JSON.stringify(row), before);
    const legacy = mapper.mapListItem({ ...row, reading_content: undefined }, 'id');
    assert.equal(legacy.reading_time_minutes, null);
  });
}

test('all existing article list paths select body internally and column list keeps parameterized contracts', () => {
  const query = fs.readFileSync(path.join(__dirname, '../src/modules/article/repositories/queries/query.js'), 'utf8');
  assert.equal((query.match(/a\.content AS reading_content/g) || []).length, 5);
  assert.match(query, /a\.status = 'published'/);
  assert.match(query, /LIMIT \$\$\{idx\} OFFSET \$\$\{idx \+ 1\}/);
  const columns = fs.readFileSync(path.join(__dirname, '../src/modules/column/repositories/queries/query.js'), 'utf8');
  assert.match(columns, /c\.content AS reading_content/);
});
