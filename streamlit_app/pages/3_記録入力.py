"""記録入力ページ"""
import streamlit as st
from datetime import date
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from utils.sheets import get_players, add_record

st.set_page_config(
    page_title="記録入力 - 駅伝チーム管理",
    page_icon="🏃",
    layout="wide",
)

st.title("記録入力")

try:
    players_df = get_players()

    if players_df.empty:
        st.warning("選手データがありません")
        st.stop()

    with st.form("record_form"):
        # 選手選択
        player_options = {f"{p['name']} ({p.get('registration_number', '-')})": p["id"]
                          for _, p in players_df.iterrows()}
        selected_name = st.selectbox("選手", options=list(player_options.keys()))
        player_id = player_options[selected_name]

        col1, col2 = st.columns(2)

        with col1:
            race_name = st.text_input("大会名", placeholder="例: 〇〇記録会")
            race_date = st.date_input("日付", value=date.today())

        with col2:
            section = st.selectbox(
                "種目",
                ["1500m", "3000m", "5000m", "10000m", "ハーフマラソン", "フルマラソン", "その他"]
            )
            if section == "その他":
                section = st.text_input("種目名を入力")

            time_input = st.text_input("タイム", placeholder="例: 15:30 または 1:05:30")

        memo = st.text_area("メモ", placeholder="コンディションや感想など")

        submitted = st.form_submit_button("記録を登録", use_container_width=True)

        if submitted:
            if not race_name:
                st.error("大会名を入力してください")
            elif not time_input:
                st.error("タイムを入力してください")
            else:
                try:
                    success = add_record(
                        player_id=player_id,
                        race_name=race_name,
                        date=race_date.isoformat(),
                        section=section,
                        time=time_input,
                        memo=memo,
                    )
                    if success:
                        st.success("記録を登録しました")
                        st.balloons()
                except Exception as e:
                    st.error(f"登録エラー: {e}")

except Exception as e:
    st.error(f"エラー: {e}")
    st.info("スプレッドシートへの接続設定を確認してください")
