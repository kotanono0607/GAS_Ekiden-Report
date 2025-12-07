FROM python:3.9-slim

WORKDIR /app

# 依存パッケージをインストール
COPY streamlit_app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションをコピー
COPY streamlit_app/ .

# Hugging Face Spaces用ポート
EXPOSE 7860

# Streamlit設定
ENV STREAMLIT_SERVER_PORT=7860
ENV STREAMLIT_SERVER_ADDRESS=0.0.0.0

# 起動コマンド
CMD ["streamlit", "run", "app.py", "--server.port=7860", "--server.address=0.0.0.0"]
