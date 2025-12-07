"""駅伝チーム管理システム - メインアプリ"""
import streamlit as st

st.set_page_config(
    page_title="駅伝チーム管理",
    page_icon="🏃",
    layout="wide",
    initial_sidebar_state="expanded",
)

# --- v0.5 CSS修正: ワイルドカードと属性セレクタで全方位から消す ---
st.markdown("""
<style>
    /* 1. 基本的なバーとメニューの非表示 */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    /* 2. [PC/モバイル共通] ツールバーとデコレーションを消す */
    [data-testid="stToolbar"] {visibility: hidden !important;}
    [data-testid="stDecoration"] {visibility: hidden !important;}
    [data-testid="stStatusWidget"] {visibility: hidden !important;}

    /* 3. [モバイル専用] 右下の赤いボタン (Viewer Badge / Hosted with Streamlit) を消す */
    /* "viewerBadge" という文字が含まれるクラスを持つ要素をすべて消す（強力版） */
    div[class^="viewerBadge"] {display: none !important;}
    div[class*="viewerBadge"] {display: none !important;}

    /* 4. [開発者用] 右下の「Manage app」ボタン対策 */
    /* ボタンの kind 属性や特定のクラスをターゲットにして消す */
    button[kind="header"] {display: none !important;}
    div[data-testid="stMobileUserControl"] {display: none !important;}
    .stAppDeployButton {display: none !important;}
</style>
""", unsafe_allow_html=True)

st.title("駅伝チーム管理システム v0.5")

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
