BEGIN;

-- =====================================================
-- 1. ROLE
-- =====================================================
INSERT INTO role (role_name) VALUES
('formateur'),
('stagiaire'),
('admin');

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
('Sylvie','Dubois','1980-01-01','sylvie@culturo.be','$2b$10$Xm4X5/K5RIi5PpMLN6jnwenQDDz77mFAar4nhbgIaqxvQERtVtEgu','0471111111',TRUE,1),
('Marc','Lefevre','1985-05-15','marc@culturo.be','$2b$10$Xm4X5/K5RIi5PpMLN6jnwenQDDz77mFAar4nhbgIaqxvQERtVtEgu','0472222222',TRUE,2),
('Antoine','Ferma','1995-01-01','antoine@culturo.be','$2b$10$Xm4X5/K5RIi5PpMLN6jnwenQDDz77mFAar4nhbgIaqxvQERtVtEgu','0473333333',TRUE,2),
('Admin','Culturo','1975-01-01','admin@culturo.be','$2b$10$Xm4X5/K5RIi5PpMLN6jnwenQDDz77mFAar4nhbgIaqxvQERtVtEgu','0474444444',TRUE,3);

-- =====================================================
-- 7. EXPLOITATION
-- =====================================================
INSERT INTO exploitation (
    exploitation_name, exploitation_locality, exploitation_active, "user_idUser"
) VALUES
('Domaine du Chene','Bruxelles',TRUE,1),
('Hameau Vert','Namur',TRUE,2);

-- =====================================================
-- 8. SOLE
-- =====================================================
INSERT INTO sole (sole_name, "exploitationIdExploitation") VALUES
('SOLE Nord',1),('SOLE Sud',1),('SOLE Ouest',2),('SOLE Est',2);

-- =====================================================
-- 9. BOARD (40 boards)
-- =====================================================
-- SOLE 1 (id_board 1 Ã  10)
INSERT INTO board (board_name, board_width, board_length, board_active, id_sole) VALUES
('N1',120,500,TRUE,1),('N2',120,500,TRUE,1),('N3',120,500,TRUE,1),('N4',120,500,TRUE,1),
('N5',120,500,TRUE,1),('N6',120,500,TRUE,1),('N7',120,500,TRUE,1),('N8',120,500,TRUE,1),
('N9',120,500,TRUE,1),('N10',120,500,TRUE,1);

-- SOLE 2 (id_board 11 Ã  20)
INSERT INTO board (board_name, board_width, board_length, board_active, id_sole) VALUES
('S2-1',120,500,TRUE,2),('S2-2',120,500,TRUE,2),('S2-3',120,500,TRUE,2),('S2-4',120,500,TRUE,2),
('S2-5',120,500,TRUE,2),('S2-6',120,500,TRUE,2),('S2-7',120,500,TRUE,2),('S2-8',120,500,TRUE,2),
('S2-9',120,500,TRUE,2),('S2-10',120,500,TRUE,2);

-- SOLE 3 (id_board 21 Ã  30)
INSERT INTO board (board_name, board_width, board_length, board_active, id_sole) VALUES
('O1',120,500,TRUE,3),('O2',120,500,TRUE,3),('O3',120,500,TRUE,3),('O4',120,500,TRUE,3),
('O5',120,500,TRUE,3),('O6',120,500,TRUE,3),('O7',120,500,TRUE,3),('O8',120,500,TRUE,3),
('O9',120,500,TRUE,3),('O10',120,500,TRUE,3);

-- SOLE 4 (id_board 31 Ã  40)
INSERT INTO board (board_name, board_width, board_length, board_active, id_sole) VALUES
('E1',120,500,TRUE,4),('E2',120,500,TRUE,4),('E3',120,500,TRUE,4),('E4',120,500,TRUE,4),
('E5',120,500,TRUE,4),('E6',120,500,TRUE,4),('E7',120,500,TRUE,4),('E8',120,500,TRUE,4),
('E9',120,500,TRUE,4),('E10',120,500,TRUE,4);

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
('MaÃ¯s','Printemps','Ete',90,120,25,80,500,14),
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
BEGIN
  PERFORM setseed(0.4217);

  FOR board_rec IN
    SELECT id_board
    FROM board
    ORDER BY id_board
  LOOP
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
        IF raw_start_date > CURRENT_DATE THEN
          raw_start_date := CURRENT_DATE - (floor(random() * 60)::int);
        END IF;
        start_date := raw_start_date;
        duration_days := 35 + floor(random() * 80)::int;
        end_date := LEAST(start_date + duration_days, CURRENT_DATE);
        IF end_date < start_date THEN
          end_date := start_date;
        END IF;
        quantity_planted := 40 + floor(random() * 161)::int;
        vegetable_id := 1 + floor(random() * 20)::int;

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
          TRUE,
          plan_id,
          vegetable_id
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- =====================================================
-- 14. AMENDED
-- =====================================================
INSERT INTO amended (amendment_date, title, description, id_board, amendement_id) VALUES
('2024-02-01','Compost N1','Applique sur N1',1,1),
('2024-02-05','Fumier N2','Applique sur N2',2,2),
('2024-02-10','Engrais vert N3','Applique sur N3',3,3);

-- =====================================================
-- 15. TREATED
-- =====================================================
INSERT INTO treated (treatment_date, treatment_quantity, treatment_unit, "boardIdBoard", "treatmentIdTreatment") VALUES
('2024-04-01',5,'L',1,1),
('2024-04-02',4,'L',2,2),
('2024-04-03',6,'L',3,3);

-- =====================================================
-- 16. WATERING (Exemples pour les premiÃ¨res sections - ID 1 Ã  5)
-- =====================================================
INSERT INTO watering(watering_date, "sectionIdSection") VALUES
('2024-04-05',1),
('2024-04-06',2),
('2024-04-07',3),
('2024-04-10',4),
('2024-04-11',5);

-- =====================================================
-- 17. HARVEST (Exemples pour les sections terminÃ©es)
-- =====================================================
INSERT INTO harvest(harvest_date, quantity, quantity_unit, "user_idUser", "sectionIdSection") VALUES
('2024-07-01', 50, 'kg', 1, 1),
('2024-06-15', 60, 'kg', 1, 4),
('2024-07-01', 55, 'kg', 2, 7);

COMMIT;
