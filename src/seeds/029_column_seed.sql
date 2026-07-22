-- Column (kolom) test fixtures — migration 014_create_columns
-- Authors:
--   member-one@example.com   00000000-0000-4000-8000-000000000111
--   member-two@example.com   00000000-0000-4000-8000-000000000112
--   member-three@example.com 00000000-0000-4000-8000-000000000113
--   article-author           00000000-0000-4000-8000-000000000109
--   superadmin               00000000-0000-4000-8000-000000000099
--
-- Status coverage:
--   ...1501 published (member-one, id+en+uz)
--   ...1502 pending_approval (member-two)
--   ...1503 rejected (member-three)
--   ...1504 published (author, id+en)

INSERT INTO "columns" (
  id, author_id, title, slug, summary, content, featured_image,
  title_en, slug_en, summary_en, content_en,
  title_uz, slug_uz, summary_uz, content_uz,
  status, rejection_reason, reviewed_by, reviewed_at, published_at,
  created_at, updated_at, deleted_at
) VALUES
(
  '00000000-0000-4000-8000-000000001501',
  '00000000-0000-4000-8000-000000000111',
  'Mengapa Literasi Finansial Penting bagi Gen Z',
  'mengapa-literasi-finansial-penting-bagi-gen-z',
  'Opini tentang pentingnya literasi finansial di era digital.',
  'Literasi finansial bukan lagi pilihan, melainkan kebutuhan. Generasi Z menghadapi produk keuangan digital yang kompleks, mulai dari investasi ritel hingga pinjaman online. Tanpa pemahaman dasar, risiko kerugian meningkat. Kolom ini membahas langkah praktis membangun kebiasaan keuangan yang sehat.',
  'https://example.com/columns/literasi-finansial.jpg',
  'Why Financial Literacy Matters for Gen Z',
  'why-financial-literacy-matters-for-gen-z',
  'An opinion on why financial literacy matters in the digital age.',
  'Financial literacy is no longer optional. Gen Z faces complex digital financial products, from retail investing to online lending. Without fundamentals, the risk of loss grows. This column outlines practical steps to build healthy money habits.',
  'Nima uchun Z avlod uchun moliyaviy savodxonlik muhim',
  'nima-uchun-z-avlod-uchun-moliyaviy-savodxonlik-muhim',
  'Raqamli davrda moliyaviy savodxonlikning ahamiyati haqida fikr.',
  'Moliyaviy savodxonlik endi ixtiyoriy emas. Z avlod murakkab raqamli moliyaviy mahsulotlarga duch keladi. Asosiy bilimlarsiz zarar xavfi ortadi. Ushbu ustunda sog''lom pul odatlarini shakllantirishning amaliy qadamlari bayon etiladi.',
  'published',
  NULL,
  '00000000-0000-4000-8000-000000000099',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '2 days',
  NULL
),
(
  '00000000-0000-4000-8000-000000001502',
  '00000000-0000-4000-8000-000000000112',
  'Kerja Remote dan Produktivitas Tim',
  'kerja-remote-dan-produktivitas-tim',
  'Refleksi tentang budaya kerja jarak jauh.',
  'Kerja remote membuka akses bakat global, tetapi tanpa ritme komunikasi yang jelas produktivitas justru turun. Saya berbagi kerangka sederhana untuk sinkronisasi tim lintas zona waktu.',
  'https://example.com/columns/kerja-remote.jpg',
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  'pending_approval',
  NULL, NULL, NULL, NULL,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NULL
),
(
  '00000000-0000-4000-8000-000000001503',
  '00000000-0000-4000-8000-000000000113',
  'Kritik terhadap Model Iklan Media Digital',
  'kritik-terhadap-model-iklan-media-digital',
  'Pendapat tentang ketergantungan media pada iklan.',
  'Model bisnis berbasis iklan mendorong klik murah dan spekulasi, bukan kualitas jurnalisme. Media perlu diversifikasi pendapatan agar redaksi tetap independen.',
  NULL,
  NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, NULL,
  'rejected',
  'Argumen perlu didukung data sumber yang lebih jelas dan netral.',
  '00000000-0000-4000-8000-000000000099',
  NOW() - INTERVAL '12 hours',
  NULL,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '12 hours',
  NULL
),
(
  '00000000-0000-4000-8000-000000001504',
  '00000000-0000-4000-8000-000000000109',
  'AI di Ruang Redaksi: Peluang dan Batas Etika',
  'ai-di-ruang-redaksi-peluang-dan-batas-etika',
  'Catatan editor tentang penggunaan AI dalam produksi berita.',
  'AI membantu ringkasan dan riset awal, tetapi keputusan editorial tetap milik manusia. Transparansi kepada pembaca adalah syarat mutlak ketika AI digunakan dalam alur kerja redaksi.',
  'https://example.com/columns/ai-redaksi.jpg',
  'AI in the Newsroom: Opportunity and Ethical Limits',
  'ai-in-the-newsroom-opportunity-and-ethical-limits',
  'An editor note on using AI in news production.',
  'AI helps with summaries and early research, but editorial judgment stays human. Transparency with readers is non-negotiable whenever AI enters the newsroom workflow.',
  NULL, NULL, NULL, NULL,
  'published',
  NULL,
  '00000000-0000-4000-8000-000000000099',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '5 days',
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Views
INSERT INTO column_views (id, column_id, user_id, ip_address, viewed_at) VALUES
  ('00000000-0000-4000-8000-000000001601', '00000000-0000-4000-8000-000000001501', '00000000-0000-4000-8000-000000000112', '127.0.0.1', NOW() - INTERVAL '1 day'),
  ('00000000-0000-4000-8000-000000001602', '00000000-0000-4000-8000-000000001501', '00000000-0000-4000-8000-000000000113', '127.0.0.2', NOW() - INTERVAL '20 hours'),
  ('00000000-0000-4000-8000-000000001603', '00000000-0000-4000-8000-000000001501', NULL, '10.0.0.5', NOW() - INTERVAL '10 hours'),
  ('00000000-0000-4000-8000-000000001604', '00000000-0000-4000-8000-000000001504', '00000000-0000-4000-8000-000000000111', '127.0.0.3', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Shares
INSERT INTO column_shares (id, column_id, user_id, platform, shared_at) VALUES
  ('00000000-0000-4000-8000-000000001611', '00000000-0000-4000-8000-000000001501', '00000000-0000-4000-8000-000000000112', 'whatsapp', NOW() - INTERVAL '18 hours'),
  ('00000000-0000-4000-8000-000000001612', '00000000-0000-4000-8000-000000001501', NULL, 'copy_link', NOW() - INTERVAL '8 hours'),
  ('00000000-0000-4000-8000-000000001613', '00000000-0000-4000-8000-000000001504', '00000000-0000-4000-8000-000000000111', 'twitter', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Saves
INSERT INTO saved_columns (user_id, column_id, created_at) VALUES
  ('00000000-0000-4000-8000-000000000112', '00000000-0000-4000-8000-000000001501', NOW() - INTERVAL '15 hours'),
  ('00000000-0000-4000-8000-000000000113', '00000000-0000-4000-8000-000000001504', NOW() - INTERVAL '1 day')
ON CONFLICT (user_id, column_id) DO NOTHING;

-- Comments (on published columns only)
INSERT INTO column_comments (id, column_id, user_id, content, created_at, updated_at, deleted_at) VALUES
  (
    '00000000-0000-4000-8000-000000001621',
    '00000000-0000-4000-8000-000000001501',
    '00000000-0000-4000-8000-000000000112',
    'Setuju — literasi finansial perlu masuk kurikulum sekolah.',
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours',
    NULL
  ),
  (
    '00000000-0000-4000-8000-000000001622',
    '00000000-0000-4000-8000-000000001501',
    '00000000-0000-4000-8000-000000000113',
    'Boleh dibahas juga soal pinjol dan regulasi OJK di kolom berikutnya.',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours',
    NULL
  ),
  (
    '00000000-0000-4000-8000-000000001623',
    '00000000-0000-4000-8000-000000001504',
    '00000000-0000-4000-8000-000000000111',
    'Transparansi AI ke pembaca memang harus jadi standar redaksi.',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days',
    NULL
  )
ON CONFLICT (id) DO NOTHING;
