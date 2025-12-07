"""駅伝チーム管理システム - メインアプリ"""
import streamlit as st

st.set_page_config(
    page_title="駅伝チーム管理",
    page_icon="🏃",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ブランディング非表示CSS
st.markdown("""
<style>
    /* フッター非表示 */
    footer {visibility: hidden;}
    /* ヘッダー非表示 */
    header {visibility: hidden;}
    /* ハンバーガーメニュー非表示 */
    #MainMenu {visibility: hidden;}
</style>
""", unsafe_allow_html=True)

st.title("駅伝チーム管理システム v0.1")

st.markdown("""
このシステムでは以下の機能を利用できます：

- **選手一覧**: チームメンバーの一覧表示・検索
- **選手詳細**: 個人記録・目標タイム・パフォーマンスグラフ
- **記録入力**: 大会記録の登録

サイドバーからページを選択してください。
""")

# 接続テスト（デバッグ用）
if st.checkbox("接続テスト"):
    try:
        from utils.sheets import get_players
        df = get_players()
        st.success(f"スプレッドシート接続成功: {len(df)}名の選手データ")
        st.dataframe(df.head())
    except Exception as e:
        st.error(f"接続エラー: {e}")
        st.info("Secretsにgcp_service_accountが設定されているか確認してください")
