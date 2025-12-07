"""選手詳細ページ"""
import streamlit as st
import pandas as pd
import plotly.express as px
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from utils.sheets import (
    get_players,
    get_player_by_id,
    get_records,
    calculate_best_records,
    time_to_seconds,
)
from utils.style import hide_streamlit_branding

st.set_page_config(
    page_title="選手詳細 - 駅伝チーム管理",
    page_icon="🏃",
    layout="wide",
)

hide_streamlit_branding()

# 選手選択
player_id = st.session_state.get("selected_player_id")

# セレクトボックスで選手を選べるようにする
try:
    players_df = get_players()
    player_options = {f"{p['name']} ({p.get('registration_number', '-')})": p["id"]
                      for _, p in players_df.iterrows()}

    if player_options:
        selected_name = st.selectbox(
            "選手を選択",
            options=list(player_options.keys()),
            index=list(player_options.values()).index(player_id) if player_id in player_options.values() else 0
        )
        player_id = player_options[selected_name]
        st.session_state["selected_player_id"] = player_id

except Exception as e:
    st.error(f"選手データ取得エラー: {e}")
    st.stop()

if not player_id:
    st.warning("選手を選択してください")
    st.stop()

# 選手情報取得
player = get_player_by_id(player_id)

if not player:
    st.error("選手が見つかりません")
    st.stop()

st.title(player["name"])

# 基本情報
col1, col2 = st.columns(2)

with col1:
    st.subheader("基本情報")
    with st.container(border=True):
        st.markdown(f"**登録番号**: {player.get('registration_number', '-')}")
        st.markdown(f"**所属**: {player.get('affiliation', '-')}")
        st.markdown(f"**カテゴリ**: {player.get('category', '-')}")
        if player.get("comment"):
            st.markdown(f"**コメント**: {player.get('comment')}")

with col2:
    st.subheader("目標タイム")
    with st.container(border=True):
        targets = [
            ("1500m", player.get("target_1500m")),
            ("3000m", player.get("target_3000m")),
            ("5000m", player.get("target_5000m")),
            ("10000m", player.get("target_10000m")),
            ("ハーフ", player.get("target_half")),
            ("フル", player.get("target_full")),
        ]
        for name, target in targets:
            if target:
                st.markdown(f"**{name}**: {target}")

# 記録取得
records_df = get_records(player_id)

if not records_df.empty:
    # 自己ベスト
    st.subheader("自己ベスト")
    bests = calculate_best_records(records_df)

    if bests:
        cols = st.columns(min(len(bests), 4))
        for idx, (section, data) in enumerate(bests.items()):
            with cols[idx % 4]:
                with st.container(border=True):
                    st.metric(
                        label=section,
                        value=data["time"],
                    )
                    st.caption(f"{data['date']} {data['race_name']}")

    # パフォーマンスグラフ
    st.subheader("記録推移")

    sections = records_df["section"].unique().tolist()
    selected_section = st.selectbox("種目を選択", sections)

    section_records = records_df[records_df["section"] == selected_section].copy()

    if not section_records.empty:
        # タイムを秒に変換
        section_records["seconds"] = section_records["time"].apply(time_to_seconds)
        section_records = section_records.dropna(subset=["seconds"])
        section_records = section_records.sort_values("date")

        if not section_records.empty:
            fig = px.line(
                section_records,
                x="date",
                y="seconds",
                markers=True,
                title=f"{selected_section} 記録推移",
                labels={"date": "日付", "seconds": "タイム（秒）"},
                hover_data=["race_name", "time"],
            )
            fig.update_layout(hovermode="x unified")
            st.plotly_chart(fig, use_container_width=True)

    # 記録一覧
    st.subheader("記録一覧")
    display_df = records_df[["date", "race_name", "section", "time", "memo"]].copy()
    display_df.columns = ["日付", "大会名", "種目", "タイム", "メモ"]
    display_df = display_df.sort_values("日付", ascending=False)
    st.dataframe(display_df, use_container_width=True, hide_index=True)

else:
    st.info("まだ記録がありません")
