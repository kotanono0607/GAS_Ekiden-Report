"""Google Spreadsheets接続モジュール"""
import streamlit as st
import gspread
from google.oauth2.service_account import Credentials
import pandas as pd
from typing import Optional

# スプレッドシートID
SPREADSHEET_ID = "1Obbd41yFX_KPmag4foqtijxRpUgTZCzBq0vpqff-f3k"

# スコープ
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
]


@st.cache_resource
def get_client() -> gspread.Client:
    """認証済みgspreadクライアントを取得"""
    credentials = Credentials.from_service_account_info(
        st.secrets["gcp_service_account"],
        scopes=SCOPES
    )
    return gspread.authorize(credentials)


@st.cache_resource
def get_spreadsheet() -> gspread.Spreadsheet:
    """スプレッドシートを取得"""
    client = get_client()
    return client.open_by_key(SPREADSHEET_ID)


@st.cache_data(ttl=60)
def get_players() -> pd.DataFrame:
    """選手一覧を取得"""
    sheet = get_spreadsheet()
    worksheet = sheet.worksheet("Players")
    records = worksheet.get_all_records()
    df = pd.DataFrame(records)

    # 削除済みを除外
    if "is_deleted" in df.columns:
        df = df[df["is_deleted"] != True]
        df = df[df["is_deleted"] != "TRUE"]

    return df


@st.cache_data(ttl=60)
def get_player_by_id(player_id: str) -> Optional[dict]:
    """選手詳細を取得"""
    df = get_players()
    player = df[df["id"] == player_id]
    if player.empty:
        return None
    return player.iloc[0].to_dict()


@st.cache_data(ttl=60)
def get_records(player_id: Optional[str] = None) -> pd.DataFrame:
    """記録一覧を取得"""
    sheet = get_spreadsheet()
    worksheet = sheet.worksheet("Records")
    records = worksheet.get_all_records()
    df = pd.DataFrame(records)

    if player_id and not df.empty:
        df = df[df["player_id"] == player_id]

    return df


@st.cache_data(ttl=60)
def get_team_records() -> pd.DataFrame:
    """チーム記録を取得"""
    sheet = get_spreadsheet()
    worksheet = sheet.worksheet("TeamRecords")
    records = worksheet.get_all_records()
    return pd.DataFrame(records)


def add_record(player_id: str, race_name: str, date: str,
               section: str, time: str, memo: str = "") -> bool:
    """記録を追加"""
    import uuid
    from datetime import datetime

    sheet = get_spreadsheet()
    worksheet = sheet.worksheet("Records")

    now = datetime.now().isoformat()
    new_row = [
        str(uuid.uuid4()),  # record_id
        player_id,
        race_name,
        date,
        section,
        time,
        memo,
        now,  # created_at
        now,  # updated_at
    ]

    worksheet.append_row(new_row)

    # キャッシュクリア
    get_records.clear()

    return True


def calculate_best_records(records_df: pd.DataFrame) -> dict:
    """種目別ベストタイムを計算"""
    if records_df.empty:
        return {}

    bests = {}
    for section in records_df["section"].unique():
        section_records = records_df[records_df["section"] == section]
        # タイムを秒に変換してソート
        times = []
        for _, row in section_records.iterrows():
            time_str = str(row["time"])
            seconds = time_to_seconds(time_str)
            if seconds is not None:
                times.append((seconds, row["time"], row["date"], row["race_name"]))

        if times:
            times.sort(key=lambda x: x[0])
            best = times[0]
            bests[section] = {
                "time": best[1],
                "seconds": best[0],
                "date": best[2],
                "race_name": best[3],
            }

    return bests


def time_to_seconds(time_str: str) -> Optional[float]:
    """時間文字列を秒に変換 (MM:SS or HH:MM:SS)"""
    try:
        parts = str(time_str).split(":")
        if len(parts) == 2:
            return int(parts[0]) * 60 + float(parts[1])
        elif len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    except (ValueError, AttributeError):
        pass
    return None


def seconds_to_time(seconds: float) -> str:
    """秒を時間文字列に変換"""
    if seconds >= 3600:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = seconds % 60
        return f"{h}:{m:02d}:{s:05.2f}"
    else:
        m = int(seconds // 60)
        s = seconds % 60
        return f"{m}:{s:05.2f}"
