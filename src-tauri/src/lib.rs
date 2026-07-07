use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Card {
    pub id: i64,
    pub name: String,
    pub suit: String,
    pub rank: String,
    pub collected: bool,
}

pub struct AppState {
    pub db: Mutex<Connection>,
}

fn init_database(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS cards (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            suit        TEXT NOT NULL CHECK(suit IN ('spade','heart','club','diamond','box')),
            rank        TEXT NOT NULL,
            type        TEXT NOT NULL DEFAULT 'card' CHECK(type IN ('card','box')),
            collected   INTEGER NOT NULL DEFAULT 0,
            note        TEXT DEFAULT ''
        );"
    )?;

    // Migrate old suit names to new ones
    conn.execute("UPDATE cards SET name = REPLACE(name, '红心', '红桃') WHERE name LIKE '%红心%'", [])?;
    conn.execute("UPDATE cards SET name = REPLACE(name, '方块', '方片') WHERE name LIKE '%方块%'", [])?;

    // Check if data already exists
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM cards", [], |row| row.get(0))?;
    if count == 0 {
        insert_initial_data(conn)?;
    }

    Ok(())
}

fn insert_initial_data(conn: &Connection) -> Result<(), rusqlite::Error> {
    let suits = ["spade", "heart", "club", "diamond"];
    let ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    let suit_names = ["黑桃", "红桃", "梅花", "方片"];

    for (suit_idx, suit) in suits.iter().enumerate() {
        for rank in &ranks {
            let name = format!("{}{}", suit_names[suit_idx], rank);
            conn.execute(
                "INSERT INTO cards (name, suit, rank, type, collected) VALUES (?1, ?2, ?3, 'card', 0)",
                params![name, suit, rank],
            )?;
        }
    }

    // Jokers
    conn.execute(
        "INSERT INTO cards (name, suit, rank, type, collected) VALUES ('🃏 大王', 'box', 'JOKER', 'card', 0)",
        [],
    )?;
    conn.execute(
        "INSERT INTO cards (name, suit, rank, type, collected) VALUES ('🃏 小王', 'box', 'JOKER', 'card', 0)",
        [],
    )?;

    // Box entry
    conn.execute(
        "INSERT INTO cards (name, suit, rank, type, collected) VALUES ('📦 牌盒', 'box', 'BOX', 'box', 0)",
        [],
    )?;

    Ok(())
}

// ─── Tauri Commands ────────────────────────────────────────────────

#[tauri::command]
fn get_cards(state: State<AppState>) -> Result<Vec<Card>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, suit, rank, collected FROM cards ORDER BY id")
        .map_err(|e| e.to_string())?;

    let cards = stmt
        .query_map([], |row| {
            Ok(Card {
                id: row.get(0)?,
                name: row.get(1)?,
                suit: row.get(2)?,
                rank: row.get(3)?,
                collected: row.get::<_, i32>(4)? != 0,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(cards)
}

#[tauri::command]
fn search_cards(keyword: String, state: State<AppState>) -> Result<Vec<Card>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let pattern = format!("%{}%", keyword);

    // Map Chinese suit names to English suit values for search
    let suit_value = match keyword.as_str() {
        "黑桃" => Some("spade"),
        "红心" | "红桃" => Some("heart"),
        "梅花" | "草花" => Some("club"),
        "方块" | "方片" | "菱形" => Some("diamond"),
        "盒" | "牌盒" | "箱子" => Some("box"),
        _ => None,
    };

    let cards = if let Some(suit) = suit_value {
        let mut stmt = conn
            .prepare(
                "SELECT id, name, suit, rank, collected FROM cards
                 WHERE name LIKE ?1 OR suit LIKE ?1 OR rank LIKE ?1 OR suit = ?2
                 ORDER BY id"
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![pattern, suit], |row| {
                Ok(Card {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    suit: row.get(2)?,
                    rank: row.get(3)?,
                    collected: row.get::<_, i32>(4)? != 0,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut cards = Vec::new();
        for row in rows {
            if let Ok(card) = row {
                cards.push(card);
            }
        }
        cards
    } else {
        let mut stmt = conn
            .prepare(
                "SELECT id, name, suit, rank, collected FROM cards
                 WHERE name LIKE ?1 OR suit LIKE ?1 OR rank LIKE ?1
                 ORDER BY id"
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![pattern], |row| {
                Ok(Card {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    suit: row.get(2)?,
                    rank: row.get(3)?,
                    collected: row.get::<_, i32>(4)? != 0,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut cards = Vec::new();
        for row in rows {
            if let Ok(card) = row {
                cards.push(card);
            }
        }
        cards
    };

    Ok(cards)
}

#[tauri::command]
fn toggle_collect(card_id: i64, state: State<AppState>) -> Result<Card, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE cards SET collected = CASE WHEN collected = 0 THEN 1 ELSE 0 END WHERE id = ?1",
        params![card_id],
    )
    .map_err(|e| e.to_string())?;

    let card = conn
        .query_row(
            "SELECT id, name, suit, rank, collected FROM cards WHERE id = ?1",
            params![card_id],
            |row| {
                Ok(Card {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    suit: row.get(2)?,
                    rank: row.get(3)?,
                    collected: row.get::<_, i32>(4)? != 0,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(card)
}

#[tauri::command]
fn batch_update(ids: Vec<i64>, collected: bool, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let val: i32 = if collected { 1 } else { 0 };

    for card_id in ids {
        conn.execute(
            "UPDATE cards SET collected = ?1 WHERE id = ?2",
            params![val, card_id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn reset_collection(state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("UPDATE cards SET collected = 0", [])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ─── App Entry Point ───────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Open (or create) the database in OS temp dir (outside Tauri file watcher)
    let db_dir = std::env::temp_dir().join("card-collection-manager");
    std::fs::create_dir_all(&db_dir).ok();
    let db_path = db_dir.join("cards.db");
    let conn = Connection::open(&db_path).expect("Failed to open database");
    init_database(&conn).expect("Failed to initialize database");

    let app_state = AppState {
        db: Mutex::new(conn),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            get_cards,
            search_cards,
            toggle_collect,
            batch_update,
            reset_collection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
