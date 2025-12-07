"""駅伝チーム管理システム - メインアプリ"""
import streamlit as st
import streamlit.components.v1 as components

# --- 1. 設定（必ずファイルの先頭に） ---
st.set_page_config(
    page_title="駅伝チーム管理",
    page_icon="🏃",
    layout="wide",
    initial_sidebar_state="expanded",
)

# --- 2. 強力な非表示コード (v0.6) ---
# 方法A: CSSで「リンク先」や「属性」を狙い撃ちする
hide_style = """
    <style>
    /* 基本セット */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    /* [PC/モバイル共通] ツールバーを消す */
    div[data-testid="stToolbar"] {visibility: hidden !important;}
    div[data-testid="stDecoration"] {visibility: hidden !important;}
    div[data-testid="stStatusWidget"] {visibility: hidden !important;}

    /* [モバイル専用] 赤い王冠/Hosted with Streamlit バッジを消す */
    /* クラス名がわからなくても "streamlit.io" へのリンクを含む要素を透明にする */
    a[href*="streamlit.io"] {display: none !important;}

    /* 右下に固定されている要素をまとめて消す（荒技） */
    div[style*="position: fixed"][style*="bottom: 0px"] {display: none !important;}

    /* 開発者用ボタンも属性で消す */
    button[kind="header"] {display: none !important;}
    </style>
"""
st.markdown(hide_style, unsafe_allow_html=True)

# 方法B: Javascriptで強制的に要素を削除する（CSSが効かない場合用）
# ※これを追加するとロード後に少し遅れてフッと消えます
js_code = """
<script>
document.addEventListener('DOMContentLoaded', function() {
    // "Hosted with Streamlit" のリンクを探して親要素ごと消す
    const anchors = window.parent.document.getElementsByTagName('a');
    for (let i = 0; i < anchors.length; i++) {
        if (anchors[i].href.includes("streamlit.io")) {
            anchors[i].style.display = "none";
            anchors[i].parentElement.style.display = "none";
        }
    }
});
</script>
"""
components.html(js_code, height=0)

# --- アプリ本編 ---
st.title("駅伝チーム管理システム v0.6")

st.markdown("""
このシステムでは以下の機能を利用できます：

- **選手一覧**: チームメンバーの一覧表示・検索
- **選手詳細**: 個人記録・目標タイム・パフォーマンスグラフ
- **記録入力**: 大会記録の登録

サイドバーからページを選択してください。
""")

# 接続テスト（デバッグ用）
if st.checkbox("接続テスト"):
    import os

    # 認証方法の確認
    gcp_key = os.environ.get("GCP_KEY")
    if gcp_key:
        st.info(f"✅ GCP_KEY 環境変数: 設定済み ({len(gcp_key)} 文字)")
    else:
        st.warning("❌ GCP_KEY 環境変数: 未設定")

    try:
        from utils.sheets import get_players
        df = get_players()
        st.success(f"スプレッドシート接続成功: {len(df)}名の選手データ")
        st.dataframe(df.head())
    except Exception as e:
        st.error(f"接続エラー: {type(e).__name__}: {e}")
        st.code(str(e))
        st.info("GCP_KEY が正しいJSON形式か確認してください")
