-- Seed default formations

WITH f AS (
  INSERT INTO public.formations (lineup_id, name, is_default) VALUES (NULL, '4-4-2', true) RETURNING id
)
INSERT INTO public.formation_positions (formation_id, label, x, y, sort_order) VALUES
  ((SELECT id FROM f), 'GOL', 50, 92, 0),
  ((SELECT id FROM f), 'LD', 15, 72, 1),
  ((SELECT id FROM f), 'ZAG', 38, 72, 2),
  ((SELECT id FROM f), 'ZAG', 62, 72, 3),
  ((SELECT id FROM f), 'LE', 85, 72, 4),
  ((SELECT id FROM f), 'MD', 15, 48, 5),
  ((SELECT id FROM f), 'MC', 38, 48, 6),
  ((SELECT id FROM f), 'MC', 62, 48, 7),
  ((SELECT id FROM f), 'ME', 85, 48, 8),
  ((SELECT id FROM f), 'ATA', 15, 20, 9),
  ((SELECT id FROM f), 'ATA', 85, 20, 10);

WITH f AS (
  INSERT INTO public.formations (lineup_id, name, is_default) VALUES (NULL, '4-3-3', true) RETURNING id
)
INSERT INTO public.formation_positions (formation_id, label, x, y, sort_order) VALUES
  ((SELECT id FROM f), 'GOL', 50, 92, 0),
  ((SELECT id FROM f), 'LD', 15, 72, 1),
  ((SELECT id FROM f), 'ZAG', 38, 72, 2),
  ((SELECT id FROM f), 'ZAG', 62, 72, 3),
  ((SELECT id FROM f), 'LE', 85, 72, 4),
  ((SELECT id FROM f), 'MC', 15, 48, 5),
  ((SELECT id FROM f), 'MC', 50, 48, 6),
  ((SELECT id FROM f), 'MC', 85, 48, 7),
  ((SELECT id FROM f), 'PD', 15, 20, 8),
  ((SELECT id FROM f), 'ATA', 50, 20, 9),
  ((SELECT id FROM f), 'PE', 85, 20, 10);

WITH f AS (
  INSERT INTO public.formations (lineup_id, name, is_default) VALUES (NULL, '4-2-3-1', true) RETURNING id
)
INSERT INTO public.formation_positions (formation_id, label, x, y, sort_order) VALUES
  ((SELECT id FROM f), 'GOL', 50, 92, 0),
  ((SELECT id FROM f), 'LD', 15, 72, 1),
  ((SELECT id FROM f), 'ZAG', 38, 72, 2),
  ((SELECT id FROM f), 'ZAG', 62, 72, 3),
  ((SELECT id FROM f), 'LE', 85, 72, 4),
  ((SELECT id FROM f), 'VOL', 15, 60, 5),
  ((SELECT id FROM f), 'VOL', 85, 60, 6),
  ((SELECT id FROM f), 'MD', 15, 36, 7),
  ((SELECT id FROM f), 'MEI', 50, 36, 8),
  ((SELECT id FROM f), 'ME', 85, 36, 9),
  ((SELECT id FROM f), 'ATA', 50, 20, 10);

WITH f AS (
  INSERT INTO public.formations (lineup_id, name, is_default) VALUES (NULL, '4-1-4-1', true) RETURNING id
)
INSERT INTO public.formation_positions (formation_id, label, x, y, sort_order) VALUES
  ((SELECT id FROM f), 'GOL', 50, 92, 0),
  ((SELECT id FROM f), 'LD', 15, 72, 1),
  ((SELECT id FROM f), 'ZAG', 38, 72, 2),
  ((SELECT id FROM f), 'ZAG', 62, 72, 3),
  ((SELECT id FROM f), 'LE', 85, 72, 4),
  ((SELECT id FROM f), 'VOL', 50, 60, 5),
  ((SELECT id FROM f), 'MD', 15, 48, 6),
  ((SELECT id FROM f), 'MC', 38, 48, 7),
  ((SELECT id FROM f), 'MC', 62, 48, 8),
  ((SELECT id FROM f), 'ME', 85, 48, 9),
  ((SELECT id FROM f), 'ATA', 50, 20, 10);

WITH f AS (
  INSERT INTO public.formations (lineup_id, name, is_default) VALUES (NULL, '4-3-1-2', true) RETURNING id
)
INSERT INTO public.formation_positions (formation_id, label, x, y, sort_order) VALUES
  ((SELECT id FROM f), 'GOL', 50, 92, 0),
  ((SELECT id FROM f), 'LD', 15, 72, 1),
  ((SELECT id FROM f), 'ZAG', 38, 72, 2),
  ((SELECT id FROM f), 'ZAG', 62, 72, 3),
  ((SELECT id FROM f), 'LE', 85, 72, 4),
  ((SELECT id FROM f), 'VOL', 15, 48, 5),
  ((SELECT id FROM f), 'MC', 50, 48, 6),
  ((SELECT id FROM f), 'MC', 85, 48, 7),
  ((SELECT id FROM f), 'MEI', 50, 36, 8),
  ((SELECT id FROM f), 'ATA', 15, 20, 9),
  ((SELECT id FROM f), 'ATA', 85, 20, 10);

WITH f AS (
  INSERT INTO public.formations (lineup_id, name, is_default) VALUES (NULL, '4-4-1-1', true) RETURNING id
)
INSERT INTO public.formation_positions (formation_id, label, x, y, sort_order) VALUES
  ((SELECT id FROM f), 'GOL', 50, 92, 0),
  ((SELECT id FROM f), 'LD', 15, 72, 1),
  ((SELECT id FROM f), 'ZAG', 38, 72, 2),
  ((SELECT id FROM f), 'ZAG', 62, 72, 3),
  ((SELECT id FROM f), 'LE', 85, 72, 4),
  ((SELECT id FROM f), 'MD', 15, 48, 5),
  ((SELECT id FROM f), 'MC', 38, 48, 6),
  ((SELECT id FROM f), 'MC', 62, 48, 7),
  ((SELECT id FROM f), 'ME', 85, 48, 8),
  ((SELECT id FROM f), 'MEI', 50, 36, 9),
  ((SELECT id FROM f), 'ATA', 50, 20, 10);

WITH f AS (
  INSERT INTO public.formations (lineup_id, name, is_default) VALUES (NULL, '3-5-2', true) RETURNING id
)
INSERT INTO public.formation_positions (formation_id, label, x, y, sort_order) VALUES
  ((SELECT id FROM f), 'GOL', 50, 92, 0),
  ((SELECT id FROM f), 'ZAG', 15, 72, 1),
  ((SELECT id FROM f), 'ZAG', 50, 72, 2),
  ((SELECT id FROM f), 'ZAG', 85, 72, 3),
  ((SELECT id FROM f), 'MD', 15, 48, 4),
  ((SELECT id FROM f), 'VOL', 33, 48, 5),
  ((SELECT id FROM f), 'MC', 50, 48, 6),
  ((SELECT id FROM f), 'VOL', 68, 48, 7),
  ((SELECT id FROM f), 'ME', 85, 48, 8),
  ((SELECT id FROM f), 'ATA', 15, 20, 9),
  ((SELECT id FROM f), 'ATA', 85, 20, 10);

WITH f AS (
  INSERT INTO public.formations (lineup_id, name, is_default) VALUES (NULL, '3-4-3', true) RETURNING id
)
INSERT INTO public.formation_positions (formation_id, label, x, y, sort_order) VALUES
  ((SELECT id FROM f), 'GOL', 50, 92, 0),
  ((SELECT id FROM f), 'ZAG', 15, 72, 1),
  ((SELECT id FROM f), 'ZAG', 50, 72, 2),
  ((SELECT id FROM f), 'ZAG', 85, 72, 3),
  ((SELECT id FROM f), 'MD', 15, 48, 4),
  ((SELECT id FROM f), 'MC', 38, 48, 5),
  ((SELECT id FROM f), 'MC', 62, 48, 6),
  ((SELECT id FROM f), 'ME', 85, 48, 7),
  ((SELECT id FROM f), 'PD', 15, 20, 8),
  ((SELECT id FROM f), 'ATA', 50, 20, 9),
  ((SELECT id FROM f), 'PE', 85, 20, 10);

WITH f AS (
  INSERT INTO public.formations (lineup_id, name, is_default) VALUES (NULL, '3-4-2-1', true) RETURNING id
)
INSERT INTO public.formation_positions (formation_id, label, x, y, sort_order) VALUES
  ((SELECT id FROM f), 'GOL', 50, 92, 0),
  ((SELECT id FROM f), 'ZAG', 15, 72, 1),
  ((SELECT id FROM f), 'ZAG', 50, 72, 2),
  ((SELECT id FROM f), 'ZAG', 85, 72, 3),
  ((SELECT id FROM f), 'MD', 15, 48, 4),
  ((SELECT id FROM f), 'MC', 38, 48, 5),
  ((SELECT id FROM f), 'MC', 62, 48, 6),
  ((SELECT id FROM f), 'ME', 85, 48, 7),
  ((SELECT id FROM f), 'MEI', 15, 36, 8),
  ((SELECT id FROM f), 'MEI', 85, 36, 9),
  ((SELECT id FROM f), 'ATA', 50, 20, 10);

WITH f AS (
  INSERT INTO public.formations (lineup_id, name, is_default) VALUES (NULL, '5-3-2', true) RETURNING id
)
INSERT INTO public.formation_positions (formation_id, label, x, y, sort_order) VALUES
  ((SELECT id FROM f), 'GOL', 50, 92, 0),
  ((SELECT id FROM f), 'LD', 15, 72, 1),
  ((SELECT id FROM f), 'ZAG', 33, 72, 2),
  ((SELECT id FROM f), 'ZAG', 50, 72, 3),
  ((SELECT id FROM f), 'ZAG', 68, 72, 4),
  ((SELECT id FROM f), 'LE', 85, 72, 5),
  ((SELECT id FROM f), 'MC', 15, 48, 6),
  ((SELECT id FROM f), 'MC', 50, 48, 7),
  ((SELECT id FROM f), 'MC', 85, 48, 8),
  ((SELECT id FROM f), 'ATA', 15, 20, 9),
  ((SELECT id FROM f), 'ATA', 85, 20, 10);

WITH f AS (
  INSERT INTO public.formations (lineup_id, name, is_default) VALUES (NULL, '5-4-1', true) RETURNING id
)
INSERT INTO public.formation_positions (formation_id, label, x, y, sort_order) VALUES
  ((SELECT id FROM f), 'GOL', 50, 92, 0),
  ((SELECT id FROM f), 'LD', 15, 72, 1),
  ((SELECT id FROM f), 'ZAG', 33, 72, 2),
  ((SELECT id FROM f), 'ZAG', 50, 72, 3),
  ((SELECT id FROM f), 'ZAG', 68, 72, 4),
  ((SELECT id FROM f), 'LE', 85, 72, 5),
  ((SELECT id FROM f), 'MD', 15, 48, 6),
  ((SELECT id FROM f), 'MC', 38, 48, 7),
  ((SELECT id FROM f), 'MC', 62, 48, 8),
  ((SELECT id FROM f), 'ME', 85, 48, 9),
  ((SELECT id FROM f), 'ATA', 50, 20, 10);

