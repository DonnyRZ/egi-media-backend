const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildCategoryTranslationPlan,
  buildRetryTargets,
  isCategorySourceCurrent,
} = require("../src/modules/category/repositories/commands/translation_plan");

test("Indonesian-only category queues name translations and leaves empty descriptions alone", () => {
  const plan = buildCategoryTranslationPlan({
    sourceName: "Berita Ekonomi",
    sourceDescription: "",
  });

  assert.deepEqual(plan.targets, [
    { locale: "en", field: "name" },
    { locale: "uz", field: "name" },
  ]);
  assert.equal(plan.states[0].status, "pending");
  assert.equal(plan.translationValues.name_en, null);
  assert.equal(plan.translationValues.description_en, null);
});

test("manual English fields stay editor-owned while AI fills missing Uzbek fields", () => {
  const plan = buildCategoryTranslationPlan({
    sourceName: "Berita Ekonomi",
    sourceDescription: "Liputan ekonomi dan bisnis terbaru.",
    translations: {
      en: { name: "Economic News", description: "Latest economic coverage." },
      uz: { name: "", description: "" },
    },
  });

  assert.deepEqual(plan.targets, [
    { locale: "uz", field: "name" },
    { locale: "uz", field: "description" },
  ]);
  assert.equal(plan.states[0].name_origin, "manual");
  assert.equal(plan.states[0].description_origin, "manual");
});

test("source changes refresh only AI-owned fields and preserve manual translations", () => {
  const plan = buildCategoryTranslationPlan({
    sourceName: "Berita Ekonomi Global",
    sourceDescription: "Liputan ekonomi dan bisnis terbaru.",
    translations: {
      en: { name: "Global Economic News", description: "Old AI description." },
      uz: { name: "Yangiliklar Iqtisodiyoti", description: "" },
    },
    currentCategory: {
      name: "Berita Ekonomi",
      description: "Liputan ekonomi terbaru.",
      name_en: "Economic News",
      description_en: "Old AI description.",
      name_uz: "Yangiliklar Iqtisodiyoti",
      description_uz: null,
    },
    currentStates: [
      {
        locale: "en",
        name_origin: "manual",
        description_origin: "ai",
        name_source_text: "Berita Ekonomi",
        description_source_text: "Liputan ekonomi terbaru.",
        status: "ready",
      },
      {
        locale: "uz",
        name_origin: "manual",
        description_origin: "ai",
        name_source_text: "Berita Ekonomi",
        description_source_text: "Liputan ekonomi terbaru.",
        status: "pending",
      },
    ],
  });

  assert.equal(plan.translationValues.name_en, "Global Economic News");
  assert.equal(plan.translationValues.description_en, null);
  assert.equal(plan.translationValues.name_uz, "Yangiliklar Iqtisodiyoti");
  assert.deepEqual(plan.targets, [
    { locale: "en", field: "description" },
    { locale: "uz", field: "description" },
  ]);
  assert.equal(plan.states[0].name_origin, "manual");
});

test("manual input supplied while an AI job is pending prevents that field from being queued", () => {
  const plan = buildCategoryTranslationPlan({
    sourceName: "Teknologi",
    sourceDescription: "",
    translations: { en: { name: "Technology" } },
    currentCategory: { name: "Teknologi", description: null, name_en: null },
    currentStates: [{ locale: "en", name_origin: "ai", status: "processing" }],
  });

  assert.equal(plan.translationValues.name_en, "Technology");
  assert.equal(plan.states[0].name_origin, "manual");
  assert.equal(plan.targets.some((target) => target.locale === "en" && target.field === "name"), false);
});

test("blank description source is never sent for AI translation", () => {
  const plan = buildCategoryTranslationPlan({
    sourceName: "Berita Politik",
    sourceDescription: "   ",
    translations: { en: { description: "" }, uz: { description: "" } },
  });

  assert.deepEqual(plan.targets, [
    { locale: "en", field: "name" },
    { locale: "uz", field: "name" },
  ]);
  assert.equal(plan.translationValues.description_en, null);
  assert.equal(plan.states[0].description_origin, null);
});

test("retry selects only missing AI-owned fields for the failed locale", () => {
  const targets = buildRetryTargets(
    {
      name: "Teknologi",
      description: "Liputan teknologi.",
      name_en: "Technology",
      description_en: null,
    },
    { name_origin: "ai", description_origin: "ai" },
    "en",
  );
  assert.deepEqual(targets, [{ locale: "en", field: "description" }]);
});

test("a queued job becomes stale as soon as its Indonesian source changes", () => {
  const job = { sourceName: "Bisnis", sourceDescription: "Berita bisnis." };
  assert.equal(isCategorySourceCurrent(job, { name: "Bisnis", description: "Berita bisnis." }), true);
  assert.equal(isCategorySourceCurrent(job, { name: "Bisnis Global", description: "Berita bisnis." }), false);
  assert.equal(isCategorySourceCurrent(job, null), false);
});
