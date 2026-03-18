-- V1: Initial Schema (Stateless SaaS Architecture)

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NULL, -- Ermöglicht Kunden-Login mit Passwort
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE user_roles (
    user_id BIGINT,
    role_id BIGINT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE gallery_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    parent_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES gallery_groups(id) ON DELETE SET NULL
);

CREATE TABLE galleries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gallery_group_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    type ENUM('selection', 'delivery') NOT NULL DEFAULT 'delivery',
    is_live BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255) NULL, 
    expires_at TIMESTAMP NULL,       
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gallery_group_id) REFERENCES gallery_groups(id) ON DELETE SET NULL
);

CREATE TABLE photos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gallery_id BIGINT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    lr_uuid VARCHAR(64) NOT NULL,
    width INT DEFAULT 0,
    height INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gallery_id) REFERENCES galleries(id) ON DELETE CASCADE,
    UNIQUE(gallery_id, lr_uuid)
);

CREATE TABLE ratings (
    photo_id BIGINT,
    user_id BIGINT,
    rating TINYINT CHECK (rating IN (0, 1, 2, 3, 4, 5)),
    comment TEXT,
    PRIMARY KEY (photo_id, user_id),
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_gallery_groups (
    user_id BIGINT,
    gallery_group_id BIGINT,
    PRIMARY KEY (user_id, gallery_group_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (gallery_group_id) REFERENCES gallery_groups(id) ON DELETE CASCADE
);

CREATE TABLE user_galleries (
    user_id BIGINT,
    gallery_id BIGINT,
    PRIMARY KEY (user_id, gallery_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (gallery_id) REFERENCES galleries(id) ON DELETE CASCADE
);

CREATE TABLE download_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    user_name_snapshot VARCHAR(255) NULL, 
    gallery_id BIGINT NULL,
    gallery_name_snapshot VARCHAR(255) NULL, 
    item_type ENUM('single_image', 'full_zip') NOT NULL,
    item_identifier VARCHAR(255) NOT NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (gallery_id) REFERENCES galleries(id) ON DELETE SET NULL
);

CREATE TABLE gallery_invites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gallery_id BIGINT NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gallery_id) REFERENCES galleries(id) ON DELETE CASCADE
);
