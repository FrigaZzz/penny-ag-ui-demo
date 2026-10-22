"""Single-user demo data. All money is stored as integer cents."""
import json
import os
import sqlite3
from pathlib import Path

DB = Path(os.getenv("PENNY_DB", "data/penny.sqlite"))
CATEGORIES = ["Housing", "Groceries", "Dining", "Transport", "Utilities", "Subscriptions", "Shopping", "Health"]
LIMITS = [165000, 62000, 48000, 26000, 24000, 11000, 42000, 18000]
SPENT = [145000, 41500, 36500, 16000, 21200, 9600, 31000, 7500]
MERCHANTS = [["Willow Apartments"], ["Whole Foods", "Trader Joe's", "Local market"], ["Sunday Coffee", "Little Italy", "DoorDash"], ["Metro pass", "Shell"], ["City Energy", "Fiber Internet"], ["Netflix", "Spotify", "iCloud"], ["Uniqlo", "Bookshop", "Amazon"], ["Pharmacy", "Gym"]]


def connect():
    DB.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB)
    connection.row_factory = sqlite3.Row
    return connection


def init():
    with connect() as db:
        db.executescript("""
          CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), income INTEGER NOT NULL, goal INTEGER NOT NULL, revision INTEGER NOT NULL DEFAULT 0);
          CREATE TABLE IF NOT EXISTS budgets (category TEXT PRIMARY KEY, amount INTEGER NOT NULL CHECK(amount>=0));
          CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY, date TEXT, merchant TEXT, category TEXT, amount INTEGER NOT NULL);
          CREATE TABLE IF NOT EXISTS approvals (id INTEGER PRIMARY KEY, created_at TEXT DEFAULT CURRENT_TIMESTAMP, document TEXT NOT NULL);
        """)
        if db.execute("SELECT 1 FROM settings").fetchone():
            return
        db.execute("INSERT INTO settings VALUES (1,520000,120000,0)")
        db.executemany("INSERT INTO budgets VALUES (?,?)", zip(CATEGORIES, LIMITS))
        for index, (category, spent, merchants) in enumerate(zip(CATEGORIES, SPENT, MERCHANTS)):
            for j, merchant in enumerate(merchants):
                amount = spent // len(merchants) if j < len(merchants) - 1 else spent - (spent // len(merchants)) * j
                db.execute("INSERT INTO transactions(date,merchant,category,amount) VALUES (?,?,?,?)", (f"2026-10-{min(21, 2 + index * 2 + j):02}", merchant, category, amount))


def snapshot():
    with connect() as db:
        settings = dict(db.execute("SELECT income,goal,revision FROM settings").fetchone())
        settings["categories"] = [dict(r) for r in db.execute("SELECT b.category,b.amount,COALESCE(SUM(t.amount),0) AS spent FROM budgets b LEFT JOIN transactions t USING(category) GROUP BY b.category ORDER BY b.rowid")]
        settings["transactions"] = [dict(r) for r in db.execute("SELECT * FROM transactions ORDER BY date DESC,id DESC")]
        settings["approvals"] = db.execute("SELECT COUNT(*) FROM approvals").fetchone()[0]
        return settings


def parse_plan(document):
    """NDJSON gives each streamed row a complete, independently renderable value."""
    if len(document) > 30000:
        raise ValueError("Plan is too large")
    rows = [json.loads(line) for line in document.splitlines() if line.strip()]
    if any(not isinstance(row, dict) for row in rows):
        raise ValueError("Every plan line must be a JSON object")
    allocations = [r for r in rows if r.get("type") == "allocation"]
    if len(allocations) != len(CATEGORIES) or {r.get("category") for r in allocations} != set(CATEGORIES):
        raise ValueError("Include exactly one allocation for every budget category")
    for row in allocations:
        value = row.get("amount")
        if type(value) is not int or not 0 <= value <= 10000000:
            raise ValueError("Amounts must be nonnegative integer cents")
    return allocations


def save_plan(document, revision):
    allocations = parse_plan(document)
    with connect() as db:
        # Acquire the write lock before checking the revision.
        db.execute("BEGIN IMMEDIATE")
        current = db.execute("SELECT income,goal,revision FROM settings").fetchone()
        if current["revision"] != revision:
            raise ValueError("Budget changed since this draft. Generate a new plan before approving.")
        if sum(r["amount"] for r in allocations) > current["income"] - current["goal"]:
            raise ValueError("This plan does not leave enough income for the savings goal")
        db.executemany("UPDATE budgets SET amount=? WHERE category=?", [(r["amount"], r["category"]) for r in allocations])
        db.execute("INSERT INTO approvals(document) VALUES (?)", (document,))
        db.execute("UPDATE settings SET revision=revision+1")
    return snapshot()


def set_goal(cents):
    if type(cents) is not int:
        raise ValueError("Goal must be integer cents")
    with connect() as db:
        income = db.execute("SELECT income FROM settings").fetchone()[0]
        if not 0 <= cents <= income:
            raise ValueError("Savings goal must be between zero and monthly income")
        db.execute("UPDATE settings SET goal=?,revision=revision+1", (cents,))
    return snapshot()
