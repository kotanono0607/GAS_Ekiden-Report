"""駅伝チーム管理システム - メインアプリ"""
import streamlit as st

st.set_page_config(
    page_title="駅伝チーム管理",
    page_icon="🏃",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ブランディング非表示CSS（モバイル対応強化版）
st.markdown("""
<style>
    /* 1. ヘッダー、フッター、ハンバーガーメニューを消す */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    /* 2. モバイル画面右下の「Hosted with Streamlit」バッジ（赤いボタン）を消す */
    .viewerBadge_container__1QSob {display: none !important;}
    .styles_viewerBadge__1yB5_ {display: none !important;}
    .viewerBadge_link__1S137 {display: none !important;}
    .viewerBadge_text__1JaDK {display: none !important;}

    /* 3. その他ツールバー関連を強制非表示 */
    [data-testid="stToolbar"] {visibility: hidden !important;}
    [data-testid="stDecoration"] {visibility: hidden !important;}
    [data-testid="stStatusWidget"] {visibility: hidden !important;}
</style>
""", unsafe_allow_html=True)

st.title("駅伝チーム管理システム v0.3")

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
