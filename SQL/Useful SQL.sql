# 공개 카테고리 + 링크 가져오기
SELECT
    c.id AS category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    c.sort_order AS category_sort_order,
    l.id AS link_id,
    l.title,
    l.url,
    l.description,
    l.icon_name,
    l.sort_order AS link_sort_order
FROM link_categories c
LEFT JOIN links l
    ON l.category_id = c.id
   AND l.is_visible = TRUE
WHERE c.is_visible = TRUE
ORDER BY c.sort_order ASC, l.sort_order ASC, l.id ASC;

# 공개 CV 섹션 가져오기
SELECT
    id,
    section_key,
    title,
    content_json,
    sort_order
FROM cv_sections
WHERE is_visible = TRUE
ORDER BY sort_order ASC, id ASC;

# 링크 추가
SELECT
    id,
    section_key,
    title,
    content_json,
    sort_order
FROM cv_sections
WHERE is_visible = TRUE
ORDER BY sort_order ASC, id ASC;

# 링크 수정
UPDATE links
SET
    title = 'FastAPI Docs',
    url = 'https://fastapi.tiangolo.com/',
    description = 'Official FastAPI documentation',
    icon_name = 'globe',
    sort_order = 3,
    is_visible = TRUE
WHERE id = 1;

# 링크 삭제
DELETE FROM links
WHERE id = 1;

# CV 섹션 JSON 수정
UPDATE cv_sections
SET content_json = JSON_SET(content_json, '$.headline', 'AI Researcher / Backend Developer')
WHERE section_key = 'hero';

# skills 배열 바꾸기
UPDATE cv_sections
SET content_json = JSON_SET(
    content_json,
    '$.items',
    JSON_ARRAY('Python', 'FastAPI', 'React', 'Vite', 'MySQL')
)
WHERE section_key = 'skills';

# admin audit logs
CREATE TABLE admin_audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id BIGINT UNSIGNED NULL,
    payload_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_admin_audit_logs_user_id (user_id),
    KEY idx_admin_audit_logs_created_at (created_at),
    CONSTRAINT fk_admin_audit_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;