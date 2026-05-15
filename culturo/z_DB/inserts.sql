BEGIN;

-- Reset tables and identities so a failed previous seed can be retried
-- without having to remove the Docker volume manually.
DO $$
DECLARE
  truncate_stmt text;
BEGIN
  SELECT
    'TRUNCATE TABLE ' ||
    string_agg(format('%I.%I', schemaname, tablename), ', ' ORDER BY tablename) ||
    ' RESTART IDENTITY CASCADE;'
  INTO truncate_stmt
  FROM pg_tables
  WHERE schemaname = 'public';

  EXECUTE truncate_stmt;
END $$;

-- =====================================================
-- 1. ROLE
-- =====================================================
INSERT INTO role (role_name) VALUES
('admin'),
('formateur'),
('stagiaire');

-- =====================================================
-- 2. FAMILY IMPORTANCE
-- =====================================================
INSERT INTO family_importance (importance_name) VALUES
('primaire'), -- ID 1
('secondaire'), -- ID 2
('tertiaire'); -- ID 3

-- =====================================================
-- 3. FAMILY
-- =====================================================
INSERT INTO family (family_name, "familyImportanceIdFamilyImportance") VALUES
('Brassicacees',1),('Solanacees',1),('Rosacees',1),('Vitacees',1),('Fagacees',1),
('Cruciferes',1),('Fabacees',2),('Apiacees',2),('Cucurbitacees',2),('Amaryllidacees',2),
('Malvacees',2),('Euphorbiacees',2),('Asteracees',3),('Poacees',3),('Chenopodiaceae',3),
('Lamiacees',3),('Cannabinacees',3),('Polygonacees',3),('Amaranthacees',3),('Persicacees',3);

-- =====================================================
-- 4. AMENDMENT
-- =====================================================
INSERT INTO amendement (amendment_name) VALUES
('Compost'),('Fumier'),('Engrais vert'),('Chaux'),('Broyat');

-- =====================================================
-- 5. TREATMENT
-- =====================================================
INSERT INTO treatment (treatment_name) VALUES
('Purin ortie'),('Savon noir'),('Prele'),('Thym'),('Bouillie bordelaise'),
('Soufre'),('Pyrethre'),('Rotenone'),('BT'),('Huile neem');

-- =====================================================
-- 6. USER
-- =====================================================
INSERT INTO "user_" (
    user_first_name, user_last_name, birth_date,
    email, hpassword, phone, user_active, "id_role"
) VALUES
('Sylvie','Dubois','1980-01-01','sylvie@culturo.be','$2b$10$Xm4X5/K5RIi5PpMLN6jnwenQDDz77mFAar4nhbgIaqxvQERtVtEgu','0471111111',TRUE,2),
('Marc','Lefevre','1985-05-15','marc@culturo.be','$2b$10$Xm4X5/K5RIi5PpMLN6jnwenQDDz77mFAar4nhbgIaqxvQERtVtEgu','0472222222',TRUE,2),
('Antoine','Ferma','1995-01-01','antoine@culturo.be','$2b$10$Xm4X5/K5RIi5PpMLN6jnwenQDDz77mFAar4nhbgIaqxvQERtVtEgu','0473333333',TRUE,3),
('Admin','Culturo','1975-01-01','admin@culturo.be','$2b$10$Xm4X5/K5RIi5PpMLN6jnwenQDDz77mFAar4nhbgIaqxvQERtVtEgu','0474444444',TRUE,1),
('Formateur','Formateur','1990-01-01','formateur@culturo.be','$2b$10$bgIlmeBQuvznuzfvwYZINuIGKSzTcXHtWMu3LYjXDamVHqO7MhNl.','0475555555',TRUE,2),
('Stagiaire','Stagiaire','2000-01-01','stagiaire@culturo.be','$2b$10$bgIlmeBQuvznuzfvwYZINuIGKSzTcXHtWMu3LYjXDamVHqO7MhNl.','0476666666',TRUE,3);

-- =====================================================
-- 7. EXPLOITATION
-- =====================================================
INSERT INTO exploitation (
    exploitation_name, exploitation_locality, exploitation_active, "user_idUser"
) VALUES
('Domaine du Chene','Uccle, Bruxelles-Capitale, Belgique',TRUE,1),
('Hameau Vert','Namur, Namur, Belgique',TRUE,2),
('Domaines des Oges','Route des Oges 1, 6640 Vaux-sur-Sure, Bastogne, Belgique',TRUE,2);

-- =====================================================
-- 8. SOLE
-- =====================================================
INSERT INTO sole (sole_name, "exploitationIdExploitation") VALUES
('SOLE Nord',1),('SOLE Sud',1),
('SOLE Ouest',2),('SOLE Est',2),
('Sole X',3);

-- =====================================================
-- 9. BOARD (42 boards)
-- =====================================================
-- SOLE 1 -- Domaine du Chene Nord (id_board 1 a 10)
INSERT INTO board (board_name, board_width, board_length, board_active, id_sole) VALUES
('N1',120,500,TRUE,1),('N2',120,500,TRUE,1),('N3',120,500,TRUE,1),('N4',120,500,TRUE,1),
('N5',120,500,TRUE,1),('N6',120,500,TRUE,1),('N7',120,500,TRUE,1),('N8',120,500,TRUE,1),
('N9',120,500,TRUE,1),('N10',120,500,TRUE,1);

-- SOLE 2 -- Domaine du Chene Sud (id_board 11 a 20)
INSERT INTO board (board_name, board_width, board_length, board_active, id_sole) VALUES
('S2-1',120,500,TRUE,2),('S2-2',120,500,TRUE,2),('S2-3',120,500,TRUE,2),('S2-4',120,500,TRUE,2),
('S2-5',120,500,TRUE,2),('S2-6',120,500,TRUE,2),('S2-7',120,500,TRUE,2),('S2-8',120,500,TRUE,2),
('S2-9',120,500,TRUE,2),('S2-10',120,500,TRUE,2);

-- SOLE 3 -- Hameau Vert Ouest (id_board 21 a 30)
INSERT INTO board (board_name, board_width, board_length, board_active, id_sole) VALUES
('O1',120,500,TRUE,3),('O2',120,500,TRUE,3),('O3',120,500,TRUE,3),('O4',120,500,TRUE,3),
('O5',120,500,TRUE,3),('O6',120,500,TRUE,3),('O7',120,500,TRUE,3),('O8',120,500,TRUE,3),
('O9',120,500,TRUE,3),('O10',120,500,TRUE,3);

-- SOLE 4 -- Hameau Vert Est (id_board 31 a 40)
INSERT INTO board (board_name, board_width, board_length, board_active, id_sole) VALUES
('E1',120,500,TRUE,4),('E2',120,500,TRUE,4),('E3',120,500,TRUE,4),('E4',120,500,TRUE,4),
('E5',120,500,TRUE,4),('E6',120,500,TRUE,4),('E7',120,500,TRUE,4),('E8',120,500,TRUE,4),
('E9',120,500,TRUE,4),('E10',120,500,TRUE,4);

-- SOLE 5 -- Domaines des Oges / Sole X (id_board 41 a 42)
INSERT INTO board (board_name, board_width, board_length, board_active, id_sole) VALUES
('XC1',120,300,TRUE,5),
('X22',120,300,TRUE,5);

-- =====================================================
-- 11. VEGETABLE
-- =====================================================
INSERT INTO vegetable (
    vegetable_name, planting_season, harvest_season,
    harvest_duration_min, harvest_duration_max,
    inrow_distance, in_row_spacing, estimated_yield, "familyIdFamily"
) VALUES
-- ID 1 (Apiacees - Secondaire)
('Carotte','Printemps','Ete',90,120,5,30,100,8),
-- ID 2 (Solanacees - Primaire)
('Tomate','Printemps','Ete',60,90,50,80,200,2),
-- ID 3 (Cucurbitacees - Secondaire)
('Salade','Printemps','Ete',45,60,5,25,50,9),
-- ID 4 (Brassicacees - Primaire)
('Pomme de terre','Printemps','Ete',90,120,30,75,300,1),
-- ID 5 (Rosacees - Primaire)
('Poivron','Printemps','Ete',70,100,40,70,180,3),
-- ID 6 (Vitacees - Primaire)
('Aubergine','Printemps','Ete',80,120,50,80,160,4),
-- ID 7 (Fagacees - Primaire)
('Chou blanc','Printemps','Automne',120,150,60,80,250,5),
-- ID 8 (Cruciferes - Primaire)
('Brocoli','Printemps','Automne',90,120,50,70,200,6),
-- ID 9 (Fabacees - Secondaire)
('Oignon','Printemps','Ete',100,140,10,30,150,7),
-- ID 10 (Amaryllidacees - Secondaire)
('Courgette','Printemps','Ete',50,70,80,100,400,10),
-- ID 11 (Malvacees - Secondaire)
('Concombre','Printemps','Ete',50,70,60,100,350,11),
-- ID 12 (Euphorbiacees - Secondaire)
('Haricot vert','Printemps','Ete',50,70,10,50,180,12),
-- ID 13 (Asteracees - Tertiaire)
('Pois','Printemps','Ete',60,80,5,50,160,13),
-- ID 14 (Poacees - Tertiaire)
('Mais','Printemps','Ete',90,120,25,80,500,14),
-- ID 15 (Chenopodiaceae - Tertiaire)
('Basilic','Printemps','Ete',30,45,20,30,40,15),
-- ID 16 (Lamiacees - Tertiaire)
('Persil','Printemps','Automne',60,90,10,25,35,16),
-- ID 17 (Cannabinacees - Tertiaire)
('Coriandre','Printemps','Ete',40,60,10,30,30,17),
-- ID 18 (Polygonacees - Tertiaire)
('Aneth','Printemps','Ete',40,60,15,30,25,18),
-- ID 19 (Amaranthacees - Tertiaire)
('Menthe','Printemps','Automne',60,90,30,50,60,19),
-- ID 20 (Persicacees - Tertiaire)
('Ciboulette','Printemps','Ete',60,90,15,30,45,20);

-- =====================================================
-- 12. VARIETY
-- =====================================================
INSERT INTO variety (variety_name, "vegetableIdVegetable") VALUES
('Carotte Nantes',1),('Carotte Chantenay',1),
('Tomate Cerise',2),('Tomate Roma',2),
('Salade Batavia',3),('Salade Merveille',3);

-- =====================================================
-- 13. SECTION_PLAN + SECTION (generated)
-- =====================================================
DO $$
DECLARE
  board_rec RECORD;
  plan_year int;
  plan_id int;
  section_number int;
  creation_month int;
  creation_day int;
  start_month int;
  start_day int;
  duration_days int;
  quantity_planted int;
  vegetable_id int;
  start_date date;
  end_date date;
  raw_creation_date date;
  raw_start_date date;
  current_year int := EXTRACT(YEAR FROM CURRENT_DATE)::int;
  -- Mémorise la dernière date de fin pour chaque section (1, 2, 3) d'une planche
  -- afin d'éviter les chevauchements entre années
  last_end_dates date[];
BEGIN
  PERFORM setseed(0.4217);

  FOR board_rec IN
    SELECT id_board
    FROM board
    ORDER BY id_board
  LOOP
    -- Réinitialiser le suivi des fins de culture pour chaque nouvelle planche
    last_end_dates := ARRAY[NULL::date, NULL::date, NULL::date];

    FOR plan_year IN 2024..current_year LOOP
      creation_month := 1 + floor(random() * 12)::int;
      creation_day := 1 + floor(random() * 28)::int;
      raw_creation_date := make_date(plan_year, creation_month, creation_day);
      IF raw_creation_date > CURRENT_DATE THEN
        raw_creation_date := CURRENT_DATE - (floor(random() * 30)::int);
      END IF;

      INSERT INTO section_plan (
        creation_date,
        number_of_section,
        section_plan_active,
        id_board
      ) VALUES (
        raw_creation_date::timestamp,
        3,
        TRUE,
        board_rec.id_board
      ) RETURNING id_section_plan INTO plan_id;

      FOR section_number IN 1..3 LOOP
        start_month := 1 + floor(random() * 12)::int;
        start_day := 1 + floor(random() * 28)::int;
        raw_start_date := make_date(plan_year, start_month, start_day);

        -- Jamais de plantation dans le futur
        IF raw_start_date > CURRENT_DATE THEN
          raw_start_date := CURRENT_DATE - (floor(random() * 90)::int);
        END IF;

        start_date := raw_start_date;

        -- Si cette section avait déjà une culture, s'assurer qu'on ne chevauche pas
        IF last_end_dates[section_number] IS NOT NULL
           AND start_date <= last_end_dates[section_number] THEN
          start_date := last_end_dates[section_number] + 1;
        END IF;

        duration_days := 45 + floor(random() * 120)::int;
        end_date := start_date + duration_days;

        -- Mémoriser la date de fin pour cette section
        last_end_dates[section_number] := end_date;

        quantity_planted := 40 + floor(random() * 161)::int;
        -- N'utiliser que des légumes non-primaires pour éviter les violations accidentelles de rotation
        vegetable_id := (ARRAY[1,3,9,10,11,12,13,14,15,16,17,18,19,20])[1 + floor(random() * 14)::int];

        INSERT INTO section (
          section_number,
          start_date,
          end_date,
          quantity_planted,
          unity,
          section_active,
          "sectionPlanIdSectionPlan",
          id_vegetable
        ) VALUES (
          section_number,
          start_date::timestamp,
          end_date::timestamp,
          quantity_planted,
          'unit',
          -- Active si la culture se termine dans 14 jours ou plus,
          -- recoltee (inactive) si terminee depuis plus de 14 jours
          end_date >= (CURRENT_DATE - 14),
          plan_id,
          vegetable_id
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- =====================================================
-- 13b. SCÉNARIOS DE VIOLATION (contrôlés)
-- =====================================================
DO $$
DECLARE
  plan_id_5y_a int;
  plan_id_5y_b int;
  plan_id_cohab int;
BEGIN
  -- ── VIOLATION 5 ANS ──────────────────────────────────────────────────────
  -- Solanacees (Tomate, id=2) plantée sur N1 (id_board=1) en 2022, puis de
  -- nouveau en 2025 : écart de 3 ans < 5 ans → une seule violation détectée.

  INSERT INTO section_plan (creation_date, number_of_section, section_plan_active, id_board)
  VALUES ('2022-02-01', 3, TRUE, 1)
  RETURNING id_section_plan INTO plan_id_5y_a;

  INSERT INTO section (
    section_number, start_date, end_date,
    quantity_planted, unity, section_active,
    "sectionPlanIdSectionPlan", id_vegetable
  ) VALUES (
    1, '2022-03-01', '2022-08-01',
    60, 'unit', FALSE,
    plan_id_5y_a, 2
  );

  INSERT INTO section_plan (creation_date, number_of_section, section_plan_active, id_board)
  VALUES ('2025-02-01', 3, TRUE, 1)
  RETURNING id_section_plan INTO plan_id_5y_b;

  INSERT INTO section (
    section_number, start_date, end_date,
    quantity_planted, unity, section_active,
    "sectionPlanIdSectionPlan", id_vegetable
  ) VALUES (
    1, '2025-03-01', '2025-09-01',
    55, 'unit', FALSE,
    plan_id_5y_b, 2
  );

  -- ── COHABITATION ─────────────────────────────────────────────────────────
  -- N2 (id_board=2) : Tomate (Solanacees/primaire) + Brocoli (Cruciferes/primaire)
  -- actives simultanément → cohabitation de familles primaires.

  INSERT INTO section_plan (creation_date, number_of_section, section_plan_active, id_board)
  VALUES (CURRENT_DATE - 30, 3, TRUE, 2)
  RETURNING id_section_plan INTO plan_id_cohab;

  INSERT INTO section (
    section_number, start_date, end_date,
    quantity_planted, unity, section_active,
    "sectionPlanIdSectionPlan", id_vegetable
  ) VALUES
    (1, CURRENT_DATE - 25, CURRENT_DATE + 55, 50, 'unit', TRUE, plan_id_cohab, 2),  -- Tomate
    (2, CURRENT_DATE - 20, CURRENT_DATE + 50, 40, 'unit', TRUE, plan_id_cohab, 8);  -- Brocoli
END $$;

-- =====================================================
-- 14. AMENDED
-- =====================================================
INSERT INTO amended (amendment_date, quantity, quantity_unit, description, id_board, amendement_id) VALUES
('2024-02-01', 2.50, 'kg', 'Applique sur N1', 1, 1),
('2024-02-05', 4.00, 'kg', 'Applique sur N2', 2, 2),
('2024-02-10', 1.50, 'kg', 'Applique sur N3', 3, 3);

-- =====================================================
-- 15. TREATED
-- =====================================================
INSERT INTO treated (treatment_date, treatment_quantity, treatment_unit, "boardIdBoard", "treatmentIdTreatment") VALUES
('2024-04-01',5,'L',1,1),
('2024-04-02',4,'L',2,2),
('2024-04-03',6,'L',3,3);

-- =====================================================
-- 16. WATERING
-- =====================================================
INSERT INTO watering(watering_date, "sectionIdSection") VALUES
('2024-04-05',1),
('2024-04-06',2),
('2024-04-07',3),
('2024-04-10',4),
('2024-04-11',5);

-- =====================================================
-- 17. HARVEST
-- =====================================================
INSERT INTO harvest(harvest_date, quantity, quantity_unit, "user_idUser", "sectionIdSection") VALUES
('2024-07-01', 50, 'kg', 1, 1),
('2024-06-15', 60, 'kg', 1, 4),
('2024-07-01', 55, 'kg', 2, 7);

-- =====================================================
-- 18. SUPPLIER
-- =====================================================
INSERT INTO supplier (supplier_name, contact_email, contact_phone, website, supplier_active) VALUES
('Graines du Terroir',  'contact@graines-terroir.fr', '01 23 45 67 89', 'https://graines-terroir.fr', TRUE),  -- ID 1
('Les Plants Bio',      'info@plants-bio.be',          '02 34 56 78 90', NULL,                            TRUE),  -- ID 2
('Semencier Dupont',    NULL,                           '03 45 67 89 01', NULL,                            FALSE); -- ID 3 (inactif)

-- =====================================================
-- 19. PLANT STOCK
-- =====================================================
INSERT INTO plant_stock (quantity, unit, received_date, notes, "vegetableIdVegetable", "varietyIdVariety", "exploitationIdExploitation") VALUES
(120, 'plants', '2025-03-10', 'Réception printemps 2025',    1,    1,    1),  -- Carotte Nantes
(80,  'plants', '2025-03-10', 'Réception printemps 2025',    1,    2,    1),  -- Carotte Chantenay
(200, 'plants', '2025-03-15', 'Lot serre A',                 2,    3,    1),  -- Tomate Cerise
(150, 'plants', '2025-03-15', 'Lot serre A',                 2,    4,    1),  -- Tomate Roma
(60,  'plants', '2025-03-15', 'Commande mars',               10,   NULL, 2),  -- Courgette
(300, 'plants', '2025-03-15', 'Commande mars',               9,    NULL, 2),  -- Oignon
(0,   'plants', '2025-01-15', 'Stock épuisé',                5,    NULL, 1),  -- Poivron (zéro)
(45,  'kg',     '2025-01-20', 'Semences hiver',              4,    NULL, 3);  -- Pomme de terre (kg)

-- =====================================================
-- 20. SUPPLIER ORDER
-- =====================================================
INSERT INTO supplier_order (status, order_date, expected_date, notes, "supplierIdSupplier", "user_idUser") VALUES
('draft',     '2025-05-10', NULL,         'À valider avant fin mai',        1, 1),  -- ID 1
('sent',      '2025-04-02', '2025-04-20', 'Livraison urgente — serre B',    2, 2),  -- ID 2
('received',  '2025-03-01', '2025-03-15', 'Réception conforme',             1, 1),  -- ID 3
('cancelled', '2025-02-14', '2025-02-28', 'Fournisseur indisponible',       2, 2);  -- ID 4

-- =====================================================
-- 21. SUPPLIER ORDER ITEM
-- =====================================================
-- Commande #1 (brouillon)
INSERT INTO supplier_order_item (quantity_ordered, quantity_received, unit, unit_price, "vegetableIdVegetable", "varietyIdVariety", "supplierOrderIdSupplierOrder") VALUES
(200, 0,   'plants', '0.25', 1, 1,    1),  -- Carotte Nantes
(100, 0,   'plants', '0.45', 2, 3,    1),  -- Tomate Cerise
(50,  0,   'plants', '0.35', 8, NULL, 1);  -- Brocoli

-- Commande #2 (envoyée)
INSERT INTO supplier_order_item (quantity_ordered, quantity_received, unit, unit_price, "vegetableIdVegetable", "varietyIdVariety", "supplierOrderIdSupplierOrder") VALUES
(150, 0, 'plants', '0.20', 3, 5,    2),  -- Salade Batavia
(80,  0, 'plants', '0.35', 8, NULL, 2),  -- Brocoli
(40,  0, 'plants', '0.55', 6, NULL, 2);  -- Aubergine

-- Commande #3 (reçue)
INSERT INTO supplier_order_item (quantity_ordered, quantity_received, unit, unit_price, "vegetableIdVegetable", "varietyIdVariety", "supplierOrderIdSupplierOrder") VALUES
(60,  60,  'plants', '0.55', 10, NULL, 3),  -- Courgette
(300, 300, 'plants', '0.10', 9,  NULL, 3),  -- Oignon
(80,  80,  'plants', '0.25', 1,  2,    3);  -- Carotte Chantenay

-- Commande #4 (annulée)
INSERT INTO supplier_order_item (quantity_ordered, quantity_received, unit, unit_price, "vegetableIdVegetable", "varietyIdVariety", "supplierOrderIdSupplierOrder") VALUES
(50, 0, 'plants', '0.60', 5, NULL, 4),  -- Poivron
(30, 0, 'plants', '0.80', 2, 4,   4);  -- Tomate Roma

COMMIT;
