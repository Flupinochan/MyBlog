FROM python:3.12-slim

WORKDIR /app/

COPY requirements.txt config.toml /app/

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*
RUN pip3 install -r requirements.txt
RUN useradd -m streamlit
# RUN echo "\
# [server]\n\
# headless = true\n\
# port = \$PORT\n\
# enableXsrfProtection=false\n\
# enableCORS = false\n\
# " > /home/streamlit/.streamlit/config.toml

EXPOSE 8501

USER streamlit

# CMD [ "streamlit", "hello", "--server.port", "8501", "--server.enableCORS", "false", "--server.enableXsrfProtection", "false" ]
CMD [ "streamlit", "hello" ]