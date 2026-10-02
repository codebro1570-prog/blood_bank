-- V1: core schema. MySQL 8, InnoDB, utf8mb4.
-- Enums stored as VARCHAR (EnumType.STRING). Timestamps are DATETIME(6) UTC.
CREATE TABLE users (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    email           VARCHAR(190) NOT NULL,
    password_hash   VARCHAR(100) NOT NULL,
    full_name       VARCHAR(120) NOT NULL,
    phone           VARCHAR(20)  NULL,
    role            VARCHAR(20)  NOT NULL,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT ck_users_role CHECK (role IN ('ADMIN','STAFF','DONOR','HOSPITAL'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE blood_group (
    id   BIGINT      NOT NULL AUTO_INCREMENT,
    code VARCHAR(3)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_blood_group_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per (recipient, donor): recipient may receive red cells from donor.
CREATE TABLE blood_compatibility (
    recipient_group_id BIGINT NOT NULL,
    donor_group_id     BIGINT NOT NULL,
    PRIMARY KEY (recipient_group_id, donor_group_id),
    CONSTRAINT fk_compat_recipient FOREIGN KEY (recipient_group_id) REFERENCES blood_group (id),
    CONSTRAINT fk_compat_donor     FOREIGN KEY (donor_group_id)     REFERENCES blood_group (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8 blood groups: 1=A+ 2=A- 3=B+ 4=B- 5=AB+ 6=AB- 7=O+ 8=O-
INSERT INTO blood_group (id, code) VALUES
    (1,'A+'),(2,'A-'),(3,'B+'),(4,'B-'),(5,'AB+'),(6,'AB-'),(7,'O+'),(8,'O-');

-- 27 compatibility pairs (recipient receives from donor)
INSERT INTO blood_compatibility (recipient_group_id, donor_group_id) VALUES
    -- A+  <- A+, A-, O+, O-
    (1,1),(1,2),(1,7),(1,8),
    -- A-  <- A-, O-
    (2,2),(2,8),
    -- B+  <- B+, B-, O+, O-
    (3,3),(3,4),(3,7),(3,8),
    -- B-  <- B-, O-
    (4,4),(4,8),
    -- AB+ <- all 8
    (5,1),(5,2),(5,3),(5,4),(5,5),(5,6),(5,7),(5,8),
    -- AB- <- A-, B-, AB-, O-
    (6,2),(6,4),(6,6),(6,8),
    -- O+  <- O+, O-
    (7,7),(7,8),
    -- O-  <- O-
    (8,8);

-- Initial admin. Password: Admin@123 (BCrypt cost 10, hash generated via password encoder).
-- Hash below was produced by: new BCryptPasswordEncoder().encode("Admin@123")
INSERT INTO users (email, password_hash, full_name, role, active)
VALUES ('admin@bloodbank.org',
        '$2a$10$sVIsLf/oSgm7FITl5nT9Xue1s/lrKhR6KVjHv9imW.i1s0nHEdP5W',
        'System Administrator', 'ADMIN', TRUE);