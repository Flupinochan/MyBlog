FROM python:3.12-slim
WORKDIR /app/
COPY . /app/
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    jq \
    gnupg \
    && rm -rf /var/lib/apt/lists/*
# Google Chromeのインストール
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*
# ChromeDriver(ver115以降)の最新のStableバージョンをダウンロードし、/app/code/にインストールする
RUN LATEST_VERSION=$(wget -qO- https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json | jq -r '.channels.Stable.version') \
    && DOWNLOAD_URL=$(wget -qO- https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json | jq -r '.channels.Stable.downloads.chromedriver[] | select(.platform == "linux64").url') \
    && wget -O /tmp/chromedriver.zip $DOWNLOAD_URL \
    && unzip /tmp/chromedriver.zip -d /app/code/ \
    && rm /tmp/chromedriver.zip \
    && mv /app/code/chromedriver-linux64/chromedriver /app/code/chromedriver \
    && rm -rf /app/code/chromedriver-linux64 \
    && chmod +x /app/code/chromedriver
# Seleniumのインストール
RUN pip3 install -r requirements.txt
RUN useradd -m streamlit
WORKDIR /app/code/
ENV AWS_DEFAULT_REGION=us-west-2
ENV PATH="/app/code:${PATH}"
CMD [ "streamlit", "run", "app.py", "--server.port", "8501", "--server.address", "0.0.0.0" ]

# カレントディレクトリにインストールする場合の例
# LATEST_VERSION=$(wget -qO- https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json | jq -r '.channels.Stable.version') \
#     && DOWNLOAD_URL=$(wget -qO- https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json | jq -r '.channels.Stable.downloads.chromedriver[] | select(.platform == "linux64").url') \
#     && wget -O ./chromedriver.zip $DOWNLOAD_URL \
#     && unzip ./chromedriver.zip -d ./ \
#     && rm ./chromedriver.zip \
#     && mv ./chromedriver-linux64/chromedriver ./chromedriver \
#     && rm -rf ./chromedriver-linux64 \
#     && chmod +x ./chromedriver