"""選手一覧ページ"""
import streamlit as st
import pandas as pd
import sys
from pathlib import Path

# utilsをインポートできるようにパスを追加
sys.path.append(str(Path(__file__).parent.parent))

from utils.sheets import get_players
from utils.style import hide_streamlit_branding

st.set_page_config(
    page_title="選手一覧 - 駅伝チーム管理",
    page_icon="🏃",
    layout="wide",
)

hide_streamlit_branding()

st.title("選手一覧")

try:
    df = get_players()

    if df.empty:
        st.warning("選手データがありません")
        st.stop()

    # フィルター
    col1, col2, col3 = st.columns(3)

    with col1:
        search = st.text_input("名前で検索", "")

    with col2:
        affiliations = ["すべて"] + sorted(df["affiliation"].unique().tolist())
        affiliation = st.selectbox("所属", affiliations)

    with col3:
        categories = ["すべて"] + sorted(df["category"].unique().tolist())
        category = st.selectbox("カテゴリ", categories)

    # フィルター適用
    filtered = df.copy()

    if search:
        filtered = filtered[filtered["name"].str.contains(search, case=False, na=False)]

    if affiliation != "すべて":
        filtered = filtered[filtered["affiliation"] == affiliation]

    if category != "すべて":
        filtered = filtered[filtered["category"] == category]

    st.markdown(f"**{len(filtered)}名**の選手")

    # 選手カード表示
    cols = st.columns(3)

    for idx, (_, player) in enumerate(filtered.iterrows()):
        with cols[idx % 3]:
            with st.container(border=True):
                st.markdown(f"### {player['name']}")
                st.markdown(f"**登録番号**: {player.get('registration_number', '-')}")
                st.markdown(f"**所属**: {player.get('affiliation', '-')}")
                st.markdown(f"**カテゴリ**: {player.get('category', '-')}")

                if st.button("詳細を見る", key=f"player_{player['id']}"):
                    st.session_state["selected_player_id"] = player["id"]
                    st.switch_page("pages/2_選手詳細.py")

except Exception as e:
    st.error(f"データ取得エラー: {e}")
    st.info("スプレッドシートへの接続設定を確認してください")
