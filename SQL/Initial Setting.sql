# Initial Setting
USE portfolio_db;

INSERT INTO users (
    username,
    email,
    password_hash,
    is_admin,
    is_active
) VALUES (
    'overwindow',
    'khyunjinkorea@gmail.com',
    '$2b$12$replace_with_real_bcrypt_hash',
    TRUE,
    TRUE
);

INSERT INTO site_settings (
    site_title,
    site_subtitle,
    hero_image_url,
    resume_pdf_url,
    github_url,
    linkedin_url,
    email,
    theme_config_json
) VALUES (
    'Hyunjin Kim',
    'Researcher / Developer',
    NULL,
    NULL,
    'https://github.com/yourid',
    NULL,
    'you@example.com',
    JSON_OBJECT(
        'theme', 'light',
        'accent', 'blue'
    )
);

INSERT INTO cv_sections (section_key, title, content_json, sort_order, is_visible) VALUES
(
    'hero',
    'Hero',
    JSON_OBJECT(
        'name', 'Hyunjin Kim',
        'headline', 'Researcher / Developer',
        'summary', 'Welcome to my portfolio site.'
    ),
    1,
    TRUE
),
(
    'about',
    'About',
    JSON_OBJECT(
        'body', 'I am interested in computer science research and engineering.'
    ),
    2,
    TRUE
),
(
    'skills',
    'Skills',
    JSON_OBJECT(
        'items', JSON_ARRAY('Python', 'FastAPI', 'React', 'MySQL')
    ),
    3,
    TRUE
),
(
    'contact',
    'Contact',
    JSON_OBJECT(
        'email', 'you@example.com',
        'github', 'https://github.com/yourid'
    ),
    4,
    TRUE
);

INSERT INTO link_categories (name, slug, sort_order, is_visible) VALUES
('Development', 'development', 1, TRUE),
('Research', 'research', 2, TRUE),
('Tools', 'tools', 3, TRUE);

INSERT INTO links (category_id, title, url, description, icon_name, sort_order, is_visible) VALUES
(1, 'GitHub', 'https://github.com', 'Code hosting platform', 'github', 1, TRUE),
(1, 'Vite', 'https://vite.dev', 'Frontend build tool', 'vite', 2, TRUE),
(2, 'arXiv', 'https://arxiv.org', 'Research papers', 'file-text', 1, TRUE),
(3, 'Notion', 'https://www.notion.so', 'Workspace and notes', 'notion', 1, TRUE);	