CREATE TABLE IF NOT EXISTS cv_projects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_key VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(300) NULL,
  description TEXT NULL,
  content_json JSON NULL,

  github_url VARCHAR(500) NULL,
  demo_url VARCHAR(500) NULL,
  tech_stack JSON NULL,

  started_at DATE NULL,
  ended_at DATE NULL,

  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_cv_projects_project_key (project_key),
  KEY idx_cv_projects_order (sort_order),
  KEY idx_cv_projects_visible_order (is_visible, sort_order),
  KEY idx_cv_projects_featured_order (is_featured, sort_order)
);

CREATE TABLE IF NOT EXISTS cv_project_images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,

  image_url VARCHAR(1000) NOT NULL,
  alt_text VARCHAR(300) NULL,
  caption VARCHAR(500) NULL,

  image_type VARCHAR(50) NOT NULL DEFAULT 'screenshot',
  is_thumbnail TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_cv_project_images_project_order (project_id, sort_order),
  KEY idx_cv_project_images_thumbnail (project_id, is_thumbnail),

  CONSTRAINT fk_cv_project_images_project
    FOREIGN KEY (project_id) REFERENCES cv_projects(id)
    ON DELETE CASCADE
);
