-- Creazione delle tabelle
CREATE TABLE IF NOT EXISTS menu_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    flag_isdefault BOOLEAN DEFAULT FALSE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_choices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    option_id INT NOT NULL,
    quantity INT DEFAULT 1,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (option_id) REFERENCES menu_options(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS menu_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    item VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    flag_isdefault BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_choice_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    username VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    item VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configurations (
    function VARCHAR(255) PRIMARY KEY,
    state BOOLEAN DEFAULT FALSE,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserimento dati di esempio
INSERT INTO menu_options (item, price, flag_isdefault) VALUES
('Panino con Prosciutto', 4.50, TRUE),
('Pizza Margherita', 5.00, FALSE),
('Insalata Mista', 3.50, FALSE),
('Pasta al Pomodoro', 6.00, FALSE),
('Acqua 0.5L', 1.00, FALSE);

-- Inserimento configurazioni iniziali
INSERT INTO configurations (function, state) VALUES
('order_state', TRUE),
('notifications_state', TRUE),
('default_language', TRUE, 'en');

-- Aggiunta di un amministratore di default
INSERT INTO admins (username, display_name) VALUES
('030711admin', 'Elio Tosi'),
('329591', 'Luca Luciani'),
('418337admin', 'Antonella Mancini'),
('312518admin', 'Giulio Librando'); 
