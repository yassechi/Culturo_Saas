BEGIN;

-- =====================================================
-- 1. ROLE
-- =====================================================
INSERT INTO role (role_name) VALUES
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
('Sylvie','Dubois','1980-01-01','sylvie@culturo.be','$2b$10$KbQi8A2l2ZH3Bp6mDcU8uOYkH7N9n8kXQXlx0cRx2h/DQyJ1n/RHu','0471111111',TRUE,1),
('Marc','Lefevre','1985-05-15','marc@culturo.be','$2b$10$KbQi8A2l2ZH3Bp6mDcU8uOYkH7N9n8kXQXlx0cRx2h/DQyJ1n/RHu','0472222222',TRUE,2),
('Antoine','Ferma','1995-01-01','antoine@culturo.be','$2b$10$KbQi8A2l2ZH3Bp6mDcU8uOYkH7N9n8kXQXlx0cRx2h/DQyJ1n/RHu','0473333333',TRUE,2);

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
-- SOLE 1 (id_board 1 à 10)
INSERT INTO board (board_name, board_width, board_length, board_active, id_sole) VALUES
('N1',120,500,TRUE,1),('N2',120,500,TRUE,1),('N3',120,500,TRUE,1),('N4',120,500,TRUE,1),
('N5',120,500,TRUE,1),('N6',120,500,TRUE,1),('N7',120,500,TRUE,1),('N8',120,500,TRUE,1),
('N9',120,500,TRUE,1),('N10',120,500,TRUE,1);

-- SOLE 2 (id_board 11 à 20)
INSERT INTO board (board_name, board_width, board_length, board_active, id_sole) VALUES
('S2-1',120,500,TRUE,2),('S2-2',120,500,TRUE,2),('S2-3',120,500,TRUE,2),('S2-4',120,500,TRUE,2),
('S2-5',120,500,TRUE,2),('S2-6',120,500,TRUE,2),('S2-7',120,500,TRUE,2),('S2-8',120,500,TRUE,2),
('S2-9',120,500,TRUE,2),('S2-10',120,500,TRUE,2);

-- SOLE 3 (id_board 21 à 30)
INSERT INTO board (board_name, board_width, board_length, board_active, id_sole) VALUES
('O1',120,500,TRUE,3),('O2',120,500,TRUE,3),('O3',120,500,TRUE,3),('O4',120,500,TRUE,3),
('O5',120,500,TRUE,3),('O6',120,500,TRUE,3),('O7',120,500,TRUE,3),('O8',120,500,TRUE,3),
('O9',120,500,TRUE,3),('O10',120,500,TRUE,3);

-- SOLE 4 (id_board 31 à 40)
INSERT INTO board (board_name, board_width, board_length, board_active, id_sole) VALUES
('E1',120,500,TRUE,4),('E2',120,500,TRUE,4),('E3',120,500,TRUE,4),('E4',120,500,TRUE,4),
('E5',120,500,TRUE,4),('E6',120,500,TRUE,4),('E7',120,500,TRUE,4),('E8',120,500,TRUE,4),
('E9',120,500,TRUE,4),('E10',120,500,TRUE,4);

-- =====================================================
-- 10. SECTION_PLAN (30 plans)
-- =====================================================
-- SOLE 1 (id_section_plan 1 à 10)
INSERT INTO section_plan (creation_date, number_of_section, section_plan_active, id_board) VALUES
('2024-03-01',3,TRUE,1),('2024-03-02',3,TRUE,2),('2024-03-03',3,TRUE,3),('2024-03-04',3,TRUE,4),('2024-03-05',3,TRUE,5),
('2024-03-06',3,TRUE,6),('2024-03-07',3,TRUE,7),('2024-03-08',3,TRUE,8),('2024-03-09',3,TRUE,9),('2024-03-10',3,TRUE,10);

-- SOLE 2 (id_section_plan 11 à 20)
INSERT INTO section_plan (creation_date, number_of_section, section_plan_active, id_board) VALUES
('2024-03-11',3,TRUE,11),('2024-03-12',3,TRUE,12),('2024-03-13',3,TRUE,13),('2024-03-14',3,TRUE,14),('2024-03-15',3,TRUE,15),
('2024-03-16',3,TRUE,16),('2024-03-17',3,TRUE,17),('2024-03-18',3,TRUE,18),('2024-03-19',3,TRUE,19),('2024-03-20',3,TRUE,20);

-- SOLE 3 (id_section_plan 21 à 30)
INSERT INTO section_plan (creation_date, number_of_section, section_plan_active, id_board) VALUES
('2025-03-21',3,TRUE,21),('2025-03-22',3,TRUE,22),('2025-03-23',3,TRUE,23),('2025-03-24',3,TRUE,24),('2025-03-25',3,TRUE,25),
('2025-03-26',3,TRUE,26),('2025-03-27',3,TRUE,27),('2025-03-28',3,TRUE,28),('2025-03-29',3,TRUE,29),('2025-03-30',3,TRUE,30);

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
('Maïs','Printemps','Ete',90,120,25,80,500,14),
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
-- 13. SECTION (90 insertions réparties sur 30 plans)
-- Règle appliquée : Max 1 Légume Primaire (ID 2, 4, 5, 6, 7, 8) par Section Plan
-- =====================================================

-- Plan 1 (N1 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-04-01','2024-07-01',100,'unit',TRUE,1, 2), -- Tomate (Primaire)
(2,'2024-04-01','2024-06-01',50,'unit',TRUE,1, 1), -- Carotte (Secondaire)
(3,'2024-06-05','2024-09-01',150,'unit',TRUE,1, 3); -- Salade (Secondaire)

-- Plan 2 (N2 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-03-15','2024-06-15',80,'unit',TRUE,2, 9), -- Oignon (Secondaire)
(2,'2024-04-05','2024-07-05',100,'unit',TRUE,2, 4), -- Pomme de terre (Primaire)
(3,'2024-07-10','2024-10-10',120,'unit',TRUE,2, 10); -- Courgette (Secondaire)

-- Plan 3 (N3 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-05-01','2024-08-01',100,'unit',TRUE,3, 11), -- Concombre (Secondaire)
(2,'2024-05-01','2024-07-01',50,'unit',TRUE,3, 5), -- Poivron (Primaire)
(3,'2024-07-05','2024-10-05',150,'unit',TRUE,3, 12); -- Haricot vert (Secondaire)

-- Plan 4 (N4 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-04-10','2024-07-10',100,'unit',TRUE,4, 13), -- Pois (Tertiaire)
(2,'2024-04-10','2024-06-10',50,'unit',TRUE,4, 14), -- Maïs (Tertiaire)
(3,'2024-06-15','2024-09-15',150,'unit',TRUE,4, 6); -- Aubergine (Primaire)

-- Plan 5 (N5 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-03-20','2024-06-20',80,'unit',TRUE,5, 15), -- Basilic (Tertiaire)
(2,'2024-04-15','2024-07-15',100,'unit',TRUE,5, 16), -- Persil (Tertiaire)
(3,'2024-07-20','2024-10-20',120,'unit',TRUE,5, 7); -- Chou blanc (Primaire)

-- Plan 6 (N6 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-05-15','2024-08-15',100,'unit',TRUE,6, 8), -- Brocoli (Primaire)
(2,'2024-05-15','2024-07-15',50,'unit',TRUE,6, 18), -- Aneth (Tertiaire)
(3,'2024-07-20','2024-10-20',150,'unit',TRUE,6, 1); -- Carotte (Secondaire)

-- Plan 7 (N7 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-04-01','2024-07-01',100,'unit',TRUE,7, 3), 
(2,'2024-04-01','2024-06-01',50,'unit',TRUE,7, 9), 
(3,'2024-06-05','2024-09-01',150,'unit',TRUE,7, 2); -- Tomate (Primaire)

-- Plan 8 (N8 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-03-15','2024-06-15',80,'unit',TRUE,8, 10), 
(2,'2024-04-05','2024-07-05',100,'unit',TRUE,8, 11),
(3,'2024-07-10','2024-10-10',120,'unit',TRUE,8, 4); -- Pomme de terre (Primaire)

-- Plan 9 (N9 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-05-01','2024-08-01',100,'unit',TRUE,9, 12),
(2,'2024-05-01','2024-07-01',50,'unit',TRUE,9, 13),
(3,'2024-07-05','2024-10-05',150,'unit',TRUE,9, 5); -- Poivron (Primaire)

-- Plan 10 (N10 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-04-10','2024-07-10',100,'unit',TRUE,10, 6), -- Aubergine (Primaire)
(2,'2024-04-10','2024-06-10',50,'unit',TRUE,10, 15),
(3,'2024-06-15','2024-09-15',150,'unit',TRUE,10, 16);

-- Plan 11 (S2-1 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-03-01','2024-06-01',100,'unit',TRUE,11, 7), -- Chou blanc (Primaire)
(2,'2024-03-01','2024-05-01',50,'unit',TRUE,11, 1),
(3,'2024-05-05','2024-08-01',150,'unit',TRUE,11, 3);

-- Plan 12 (S2-2 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-03-15','2024-06-15',80,'unit',TRUE,12, 9),
(2,'2024-04-05','2024-07-05',100,'unit',TRUE,12, 10),
(3,'2024-07-10','2024-10-10',120,'unit',TRUE,12, 8); -- Brocoli (Primaire)

-- Plan 13 (S2-3 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-05-01','2024-08-01',100,'unit',TRUE,13, 2), -- Tomate (Primaire)
(2,'2024-05-01','2024-07-01',50,'unit',TRUE,13, 11),
(3,'2024-07-05','2024-10-05',150,'unit',TRUE,13, 12);

-- Plan 14 (S2-4 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-04-10','2024-07-10',100,'unit',TRUE,14, 13),
(2,'2024-04-10','2024-06-10',50,'unit',TRUE,14, 4), -- Pomme de terre (Primaire)
(3,'2024-06-15','2024-09-15',150,'unit',TRUE,14, 14);

-- Plan 15 (S2-5 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-03-20','2024-06-20',80,'unit',TRUE,15, 15),
(2,'2024-04-15','2024-07-15',100,'unit',TRUE,15, 5), -- Poivron (Primaire)
(3,'2024-07-20','2024-10-20',120,'unit',TRUE,15, 16);

-- Plan 16 (S2-6 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-05-15','2024-08-15',100,'unit',TRUE,16, 6), -- Aubergine (Primaire)
(2,'2024-05-15','2024-07-15',50,'unit',TRUE,16, 17),
(3,'2024-07-20','2024-10-20',150,'unit',TRUE,16, 18);

-- Plan 17 (S2-7 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-04-01','2024-07-01',100,'unit',TRUE,17, 19),
(2,'2024-04-01','2024-06-01',50,'unit',TRUE,17, 7), -- Chou blanc (Primaire)
(3,'2024-06-05','2024-09-01',150,'unit',TRUE,17, 20);

-- Plan 18 (S2-8 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-03-15','2024-06-15',80,'unit',TRUE,18, 1),
(2,'2024-04-05','2024-07-05',100,'unit',TRUE,18, 9),
(3,'2024-07-10','2024-10-10',120,'unit',TRUE,18, 8); -- Brocoli (Primaire)

-- Plan 19 (S2-9 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-05-01','2024-08-01',100,'unit',TRUE,19, 2), -- Tomate (Primaire)
(2,'2024-05-01','2024-07-01',50,'unit',TRUE,19, 10),
(3,'2024-07-05','2024-10-05',150,'unit',TRUE,19, 11);

-- Plan 20 (S2-10 - 2024)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2024-04-10','2024-07-10',100,'unit',TRUE,20, 12),
(2,'2024-04-10','2024-06-10',50,'unit',TRUE,20, 4), -- Pomme de terre (Primaire)
(3,'2024-06-15','2024-09-15',150,'unit',TRUE,20, 13);

-- Plan 21 (O1 - 2025)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2025-04-01','2025-07-01',100,'unit',TRUE,21, 5), -- Poivron (Primaire)
(2,'2025-04-01','2025-06-01',50,'unit',TRUE,21, 14),
(3,'2025-06-05','2025-09-01',150,'unit',TRUE,21, 15);

-- Plan 22 (O2 - 2025)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2025-03-15','2025-06-15',80,'unit',TRUE,22, 16),
(2,'2025-04-05','2025-07-05',100,'unit',TRUE,22, 6), -- Aubergine (Primaire)
(3,'2025-07-10','2025-10-10',120,'unit',TRUE,22, 17);

-- Plan 23 (O3 - 2025)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2025-05-01','2025-08-01',100,'unit',TRUE,23, 18),
(2,'2025-05-01','2025-07-01',50,'unit',TRUE,23, 19),
(3,'2025-07-05','2025-10-05',150,'unit',TRUE,23, 7); -- Chou blanc (Primaire)

-- Plan 24 (O4 - 2025)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2025-04-10','2025-07-10',100,'unit',TRUE,24, 8), -- Brocoli (Primaire)
(2,'2025-04-10','2025-06-10',50,'unit',TRUE,24, 1),
(3,'2025-06-15','2025-09-15',150,'unit',TRUE,24, 3);

-- Plan 25 (O5 - 2025)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2025-03-20','2025-06-20',80,'unit',TRUE,25, 9),
(2,'2025-04-15','2025-07-15',100,'unit',TRUE,25, 2), -- Tomate (Primaire)
(3,'2025-07-20','2025-10-20',120,'unit',TRUE,25, 10);

-- Plan 26 (O6 - 2025)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2025-05-15','2025-08-15',100,'unit',TRUE,26, 11),
(2,'2025-05-15','2025-07-15',50,'unit',TRUE,26, 12),
(3,'2025-07-20','2025-10-20',150,'unit',TRUE,26, 4); -- Pomme de terre (Primaire)

-- Plan 27 (O7 - 2025)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2025-04-01','2025-07-01',100,'unit',TRUE,27, 13),
(2,'2025-04-01','2025-06-01',50,'unit',TRUE,27, 5), -- Poivron (Primaire)
(3,'2025-06-05','2025-09-01',150,'unit',TRUE,27, 14);

-- Plan 28 (O8 - 2025)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2025-03-15','2025-06-15',80,'unit',TRUE,28, 15),
(2,'2025-04-05','2025-07-05',100,'unit',TRUE,28, 16),
(3,'2025-07-10','2025-10-10',120,'unit',TRUE,28, 6); -- Aubergine (Primaire)

-- Plan 29 (O9 - 2025)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2025-05-01','2025-08-01',100,'unit',TRUE,29, 7), -- Chou blanc (Primaire)
(2,'2025-05-01','2025-07-01',50,'unit',TRUE,29, 17),
(3,'2025-07-05','2025-10-05',150,'unit',TRUE,29, 18);

-- Plan 30 (O10 - 2025)
INSERT INTO section (section_number, start_date, end_date, quantity_planted, unity, section_active, "sectionPlanIdSectionPlan", id_vegetable) VALUES
(1,'2025-04-10','2025-07-10',100,'unit',TRUE,30, 19),
(2,'2025-04-10','2025-06-10',50,'unit',TRUE,30, 8), -- Brocoli (Primaire)
(3,'2025-06-15','2025-09-15',150,'unit',TRUE,30, 20);


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
-- 16. WATERING (Exemples pour les premières sections - ID 1 à 5)
-- =====================================================
INSERT INTO watering(watering_date, "sectionIdSection") VALUES
('2024-04-05',1),
('2024-04-06',2),
('2024-04-07',3),
('2024-04-10',4),
('2024-04-11',5);

-- =====================================================
-- 17. HARVEST (Exemples pour les sections terminées)
-- =====================================================
INSERT INTO harvest(harvest_date, quantity, quantity_unit, "user_idUser", "sectionIdSection") VALUES
('2024-07-01', 50, 'kg', 1, 1),
('2024-06-15', 60, 'kg', 1, 4),
('2024-07-01', 55, 'kg', 2, 7);

COMMIT;