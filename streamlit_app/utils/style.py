"""共通スタイル設定"""
import streamlit as st


def hide_streamlit_branding():
    """Streamlitのブランディング要素を非表示にする（v0.5 全方位対応版）"""
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
        div[class^="viewerBadge"] {display: none !important;}
        div[class*="viewerBadge"] {display: none !important;}

        /* 4. [開発者用] 右下の「Manage app」ボタン対策 */
        button[kind="header"] {display: none !important;}
        div[data-testid="stMobileUserControl"] {display: none !important;}
        .stAppDeployButton {display: none !important;}
    </style>
    """, unsafe_allow_html=True)
