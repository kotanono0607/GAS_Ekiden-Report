"""共通スタイル設定"""
import streamlit as st


def hide_streamlit_branding():
    """Streamlitのブランディング要素を非表示にする（モバイル対応強化版）"""
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
