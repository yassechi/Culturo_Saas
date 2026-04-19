-- Création des tables
CREATE TABLE family_importance (
    id_family_importance SERIAL PRIMARY KEY,
    importance_name VARCHAR NOT NULL
);

CREATE TABLE family (
    id_family SERIAL PRIMARY KEY,
    family_name VARCHAR NOT NULL,
    familyImportanceIdFamilyImportance INT,
    CONSTRAINT fk_family_importance FOREIGN KEY (familyImportanceIdFamilyImportance)
        REFERENCES family_importance (id_family_importance)
);

CREATE TABLE vegetable (
    id_vegetable SERIAL PRIMARY KEY,
    vegetable_name VARCHAR NOT NULL,
    planting_season VARCHAR NOT NULL,
    harvest_season VARCHAR NOT NULL,
    harvest_duration_min INT NOT NULL,
    harvest_duration_max INT NOT NULL,
    inrow_distance INT NOT NULL,
    estimated_yield INT NOT NULL,
    familyIdFamily INT,
    CONSTRAINT fk_vegetable_family FOREIGN KEY (familyIdFamily)
        REFERENCES family (id_family)
);

CREATE TABLE section_plan (
    id_section_plan SERIAL PRIMARY KEY,
    creation_date TIMESTAMP NOT NULL,
    number_of_section INT NOT NULL
);

CREATE TABLE section (
    id_section SERIAL PRIMARY KEY,
    numero_section INT NOT NULL,
    num_semaine_debut TIMESTAMP NOT NULL,
    num_semaine_fin TIMESTAMP NOT NULL,
    vegetableIdVegetable INT,
    sectionPlanIdSection INT,
    CONSTRAINT fk_section_vegetable FOREIGN KEY (vegetableIdVegetable)
        REFERENCES vegetable (id_vegetable),
    CONSTRAINT fk_section_plan FOREIGN KEY (sectionPlanIdSection)
        REFERENCES section (id_section)
);

CREATE TABLE watering (
    id_watering SERIAL PRIMARY KEY,
    watering_date TIMESTAMP NOT NULL,
    quantity INT NOT NULL,
    sectionIdSection INT,
    CONSTRAINT fk_watering_section FOREIGN KEY (sectionIdSection)
        REFERENCES section (id_section)
);

CREATE TABLE "user_" (
    id_user SERIAL PRIMARY KEY,
    user_first_name VARCHAR(100) NOT NULL,
    user_last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    hpassword VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    path_photo VARCHAR,
    user_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    id_role INT NOT NULL
);

CREATE TABLE harvest (
    id_harvest SERIAL PRIMARY KEY,
    id_harvest_date TIMESTAMP NOT NULL,
    quantity INT NOT NULL,
    quantity_unit VARCHAR NOT NULL,
    user_idUser INT,
    sectionIdSection INT,
    CONSTRAINT fk_harvest_user FOREIGN KEY (user_idUser)
        REFERENCES "user_" (id_user),
    CONSTRAINT fk_harvest_section FOREIGN KEY (sectionIdSection)
        REFERENCES section (id_section)
);

CREATE TABLE "order" (
    id_order SERIAL PRIMARY KEY,
    order_date TIMESTAMP NOT NULL,
    order_delivery TIMESTAMP NOT NULL,
    user_idUser INT,
    CONSTRAINT fk_order_user FOREIGN KEY (user_idUser)
        REFERENCES "user_" (id_user)
);

CREATE TABLE order_detail (
    id_treated SERIAL PRIMARY KEY,
    quantity INT NOT NULL,
    quantity_unit VARCHAR NOT NULL,
    unit_price VARCHAR NOT NULL,
    vegetableIdVegetable INT,
    orderIdOrder INT,
    CONSTRAINT fk_order_detail_vegetable FOREIGN KEY (vegetableIdVegetable)
        REFERENCES vegetable (id_vegetable),
    CONSTRAINT fk_order_detail_order FOREIGN KEY (orderIdOrder)
        REFERENCES "order" (id_order)
);

CREATE TABLE price (
    id_price SERIAL PRIMARY KEY,
    vegetable_price INT NOT NULL,
    price_date TIMESTAMP NOT NULL,
    active_price BOOLEAN NOT NULL,
    vegetableIdVegetable INT,
    CONSTRAINT fk_price_vegetable FOREIGN KEY (vegetableIdVegetable)
        REFERENCES vegetable (id_vegetable)
);

CREATE TABLE exploitation (
    id_exploitation SERIAL PRIMARY KEY,
    exploitation_name VARCHAR NOT NULL,
    exploitation_locality VARCHAR NOT NULL,
    exploitation_active VARCHAR NOT NULL,
    user_idUser INT,
    CONSTRAINT fk_exploitation_user FOREIGN KEY (user_idUser)
        REFERENCES "user_" (id_user)
);

CREATE TABLE sole (
    id_sole SERIAL PRIMARY KEY,
    sole_name VARCHAR NOT NULL,
    exploitationIdExploitation INT,
    CONSTRAINT fk_sole_exploitation FOREIGN KEY (exploitationIdExploitation)
        REFERENCES exploitation (id_exploitation)
);

CREATE TABLE board (
    id_board SERIAL PRIMARY KEY,
    board_name VARCHAR NOT NULL,
    board_width INT NOT NULL,
    board_lenght INT NOT NULL,
    board_active BOOLEAN NOT NULL,
    soleIdSole INT,
    CONSTRAINT fk_board_sole FOREIGN KEY (soleIdSole)
        REFERENCES sole (id_sole)
);

CREATE TABLE amended (
    id_treated SERIAL PRIMARY KEY,
    amendement_date TIMESTAMP NOT NULL,
    treatment_quantity INT NOT NULL,
    treatment_unit VARCHAR NOT NULL,
    boardIdBoard INT,
    amendementIdAmendement INT,
    CONSTRAINT fk_amended_board FOREIGN KEY (boardIdBoard)
        REFERENCES board (id_board),
    CONSTRAINT fk_amended_amendement FOREIGN KEY (amendementIdAmendement)
        REFERENCES amendement (id_amendement)
);

CREATE TABLE amendement (
    id_amendement SERIAL PRIMARY KEY,
    amendement_name VARCHAR NOT NULL
);

CREATE TABLE treatment (
    id_treatment SERIAL PRIMARY KEY,
    treatment_name VARCHAR NOT NULL
);

CREATE TABLE treated (
    id_treated SERIAL PRIMARY KEY,
    treatment_date TIMESTAMP NOT NULL,
    treatment_quantity INT NOT NULL,
    treatment_unit VARCHAR NOT NULL,
    boardIdBoard INT,
    treatmentIdTreatment INT,
    CONSTRAINT fk_treated_board FOREIGN KEY (boardIdBoard)
        REFERENCES board (id_board),
    CONSTRAINT fk_treated_treatment FOREIGN KEY (treatmentIdTreatment)
        REFERENCES treatment (id_treatment)
);

CREATE TABLE role (
    id_role SERIAL PRIMARY KEY,
    role_name VARCHAR NOT NULL
);
