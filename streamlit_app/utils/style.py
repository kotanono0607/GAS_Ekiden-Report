"""共通スタイル設定"""
import streamlit as st


def hide_streamlit_branding():
    """Streamlitのブランディング要素を非表示にする"""
    st.markdown("""
    <style>
        /* フッター非表示 */
        footer {visibility: hidden;}
        /* ヘッダー非表示 */
        header {visibility: hidden;}
        /* ハンバーガーメニュー非表示 */
        #MainMenu {visibility: hidden;}
        /* 王冠アイコン（デコレーション）非表示 */
        .stDecoration {display: none;}
        [data-testid="stDecoration"] {display: none;}
        /* ツールバー非表示 */
        [data-testid="stToolbar"] {display: none;}
    </style>
    """, unsafe_allow_html=True)
