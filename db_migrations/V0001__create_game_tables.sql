-- Таблица профилей игроков
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255),
    avatar_url TEXT,
    rating INTEGER DEFAULT 1200,
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица достижений
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(50),
    requirement_type VARCHAR(50),
    requirement_value INTEGER,
    points INTEGER DEFAULT 10
);

-- Таблица прогресса игроков по достижениям
CREATE TABLE player_achievements (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    achievement_id INTEGER REFERENCES achievements(id),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, achievement_id)
);

-- Таблица игр
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    white_player_id INTEGER REFERENCES players(id),
    black_player_id INTEGER REFERENCES players(id),
    game_mode VARCHAR(50) NOT NULL,
    bot_difficulty INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    winner VARCHAR(10),
    moves_json TEXT,
    board_state TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Таблица статистики по фигурам
CREATE TABLE piece_stats (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    piece_type VARCHAR(50) NOT NULL,
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    moves INTEGER DEFAULT 0,
    UNIQUE(player_id, piece_type)
);

-- Вставка базовых достижений
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, points) VALUES
('Первая победа', 'Одержите первую победу в игре', '🏆', 'wins', 'wins', 1, 10),
('Покоритель новичков', 'Победите бота уровня 1-3 десять раз', '🎯', 'bot', 'bot_wins_easy', 10, 20),
('Стратег', 'Победите бота уровня 4-7 пять раз', '🧠', 'bot', 'bot_wins_medium', 5, 30),
('Гроссмейстер', 'Победите бота уровня 8-10 три раза', '👑', 'bot', 'bot_wins_hard', 3, 50),
('Серия побед', 'Выиграйте 5 игр подряд', '🔥', 'streak', 'win_streak', 5, 40),
('Мастер телепортации', 'Используйте способность Мага 100 раз', '✨', 'pieces', 'mage_teleports', 100, 25),
('Драконий всадник', 'Выиграйте 10 игр используя Дракона', '🐉', 'pieces', 'dragon_wins', 10, 30),
('Некромант', 'Воскресите 50 фигур', '💀', 'pieces', 'necromancer_revives', 50, 35),
('Марафонец', 'Сыграйте 100 партий', '🎮', 'games', 'total_games', 100, 40),
('Легенда', 'Достигните рейтинга 2000', '⭐', 'rating', 'rating', 2000, 100);

-- Создание индексов для производительности
CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_games_players ON games(white_player_id, black_player_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_player_achievements_player ON player_achievements(player_id);