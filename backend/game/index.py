"""API для сохранения игр, профилей и достижений игроков"""

import json
import os
import psycopg2
from datetime import datetime

def get_db_connection():
    """Создать подключение к базе данных"""
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def handler(event: dict, context) -> dict:
    """Главный обработчик API запросов"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    path = event.get('queryStringParameters', {}).get('action', '')
    
    try:
        if method == 'GET':
            if path == 'profile':
                return get_player_profile(event)
            elif path == 'achievements':
                return get_player_achievements(event)
            elif path == 'leaderboard':
                return get_leaderboard(event)
        
        elif method == 'POST':
            if path == 'profile':
                return create_or_update_profile(event)
            elif path == 'game':
                return save_game(event)
            elif path == 'achievement':
                return unlock_achievement(event)
        
        elif method == 'PUT':
            if path == 'stats':
                return update_stats(event)
        
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Not found'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def get_player_profile(event: dict) -> dict:
    """Получить профиль игрока"""
    params = event.get('queryStringParameters', {})
    username = params.get('username', 'Игрок')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id, username, rating, total_games, wins, losses, draws, created_at, last_login
        FROM players 
        WHERE username = %s
    """, (username,))
    
    row = cur.fetchone()
    
    if row:
        profile = {
            'id': row[0],
            'username': row[1],
            'rating': row[2],
            'totalGames': row[3],
            'wins': row[4],
            'losses': row[5],
            'draws': row[6],
            'createdAt': row[7].isoformat() if row[7] else None,
            'lastLogin': row[8].isoformat() if row[8] else None
        }
    else:
        cur.execute("""
            INSERT INTO players (username) 
            VALUES (%s) 
            RETURNING id, username, rating, total_games, wins, losses, draws
        """, (username,))
        row = cur.fetchone()
        conn.commit()
        
        profile = {
            'id': row[0],
            'username': row[1],
            'rating': row[2],
            'totalGames': row[3],
            'wins': row[4],
            'losses': row[5],
            'draws': row[6]
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(profile),
        'isBase64Encoded': False
    }

def get_player_achievements(event: dict) -> dict:
    """Получить достижения игрока"""
    params = event.get('queryStringParameters', {})
    player_id = params.get('playerId')
    
    if not player_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Player ID required'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT a.id, a.name, a.description, a.icon, a.category, 
               a.requirement_value, a.points, pa.unlocked_at
        FROM achievements a
        LEFT JOIN player_achievements pa ON a.id = pa.achievement_id AND pa.player_id = %s
        ORDER BY a.id
    """, (int(player_id),))
    
    achievements = []
    for row in cur.fetchall():
        achievements.append({
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'icon': row[3],
            'category': row[4],
            'requirement': row[5],
            'points': row[6],
            'unlocked': row[7] is not None,
            'unlockedAt': row[7].isoformat() if row[7] else None
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(achievements),
        'isBase64Encoded': False
    }

def create_or_update_profile(event: dict) -> dict:
    """Создать или обновить профиль игрока"""
    body = json.loads(event.get('body', '{}'))
    username = body.get('username', 'Игрок')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO players (username, last_login) 
        VALUES (%s, %s)
        ON CONFLICT (username) 
        DO UPDATE SET last_login = EXCLUDED.last_login
        RETURNING id, username, rating, total_games, wins, losses, draws
    """, (username, datetime.now()))
    
    row = cur.fetchone()
    conn.commit()
    
    profile = {
        'id': row[0],
        'username': row[1],
        'rating': row[2],
        'totalGames': row[3],
        'wins': row[4],
        'losses': row[5],
        'draws': row[6]
    }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(profile),
        'isBase64Encoded': False
    }

def save_game(event: dict) -> dict:
    """Сохранить игру"""
    body = json.loads(event.get('body', '{}'))
    
    white_player_id = body.get('whitePlayerId')
    black_player_id = body.get('blackPlayerId')
    game_mode = body.get('gameMode', 'local')
    bot_difficulty = body.get('botDifficulty')
    winner = body.get('winner')
    moves = body.get('moves', [])
    board_state = body.get('boardState', [])
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    status = 'completed' if winner else 'active'
    
    cur.execute("""
        INSERT INTO games (white_player_id, black_player_id, game_mode, bot_difficulty, 
                          status, winner, moves_json, board_state, completed_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (white_player_id, black_player_id, game_mode, bot_difficulty, 
          status, winner, json.dumps(moves), json.dumps(board_state),
          datetime.now() if winner else None))
    
    game_id = cur.fetchone()[0]
    conn.commit()
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'gameId': game_id}),
        'isBase64Encoded': False
    }

def unlock_achievement(event: dict) -> dict:
    """Разблокировать достижение"""
    body = json.loads(event.get('body', '{}'))
    
    player_id = body.get('playerId')
    achievement_id = body.get('achievementId')
    
    if not player_id or not achievement_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Player ID and Achievement ID required'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO player_achievements (player_id, achievement_id)
        VALUES (%s, %s)
        ON CONFLICT (player_id, achievement_id) DO NOTHING
    """, (player_id, achievement_id))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True}),
        'isBase64Encoded': False
    }

def update_stats(event: dict) -> dict:
    """Обновить статистику игрока"""
    body = json.loads(event.get('body', '{}'))
    
    player_id = body.get('playerId')
    wins = body.get('wins', 0)
    losses = body.get('losses', 0)
    draws = body.get('draws', 0)
    rating_change = body.get('ratingChange', 0)
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        UPDATE players 
        SET total_games = total_games + 1,
            wins = wins + %s,
            losses = losses + %s,
            draws = draws + %s,
            rating = rating + %s
        WHERE id = %s
        RETURNING rating, total_games, wins, losses, draws
    """, (wins, losses, draws, rating_change, player_id))
    
    row = cur.fetchone()
    conn.commit()
    
    stats = {
        'rating': row[0],
        'totalGames': row[1],
        'wins': row[2],
        'losses': row[3],
        'draws': row[4]
    }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(stats),
        'isBase64Encoded': False
    }

def get_leaderboard(event: dict) -> dict:
    """Получить таблицу лидеров"""
    params = event.get('queryStringParameters', {})
    limit = int(params.get('limit', '10'))
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT username, rating, wins, total_games
        FROM players
        ORDER BY rating DESC
        LIMIT %s
    """, (limit,))
    
    leaderboard = []
    for row in cur.fetchall():
        leaderboard.append({
            'username': row[0],
            'rating': row[1],
            'wins': row[2],
            'totalGames': row[3]
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(leaderboard),
        'isBase64Encoded': False
    }
