USE portfolio_db;

CREATE TABLE recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    topic VARCHAR(255) NOT NULL,
    features TEXT NOT NULL,
    additional_context TEXT NULL,

    analysis TEXT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE recommended_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    recommendation_id BIGINT NOT NULL,

    type ENUM('website', 'app') NOT NULL,

    title VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    description TEXT NULL,

    sort_order INT DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (recommendation_id)
        REFERENCES recommendations(id)
        ON DELETE CASCADE
);