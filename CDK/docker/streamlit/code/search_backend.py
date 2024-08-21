from langchain_aws import ChatBedrock
from langchain.memory import ConversationBufferMemory

# from langchain.chains.conversation.base import ConversationChain
# from langchain_core.runnables import RunnablePassthrough
from langchain_community.callbacks.streamlit import StreamlitCallbackHandler
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from botocore.config import Config
from typing import List, Tuple, Optional, Any
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time
import boto3
import re

from LoggingClass import LoggingClass

# ロガー設定
logger = LoggingClass("DEBUG")
log = logger.get_logger()

# boto3 client設定
config = Config(
    retries={"max_attempts": 30, "mode": "standard"},
    read_timeout=900,
    connect_timeout=900,
)
comprehend_client = boto3.client("comprehend", config=config)
bedrock_runtime_client = boto3.client("bedrock-runtime", config=config)


class Backend:
    # def __init__(self, st_container):
    #     self.store = {}
    #     self.prompt_template = ChatPromptTemplate.from_messages(
    #         [
    #             MessagesPlaceholder(variable_name="history"),
    #             ("human", "{input}"),
    #         ]
    #     )
    #     self.streamlit_handler = StreamlitCallbackHandler(st_container)

    #############################################################
    # ユーザが入力したチャットからURLを抽出し、URLのリストを返す処理 #
    #############################################################
    # テキストの言語を検出
    def detect_language(self, text: str) -> str:
        response = comprehend_client.detect_dominant_language(Text=text)
        language = response["Languages"][0]["LanguageCode"]
        supported_languages = ["en", "es", "fr", "de", "it", "pt", "ar", "hi", "ja", "ko", "zh", "zh-TW"]
        if language not in supported_languages:
            language = "en"
        return language

    # 単語に分割
    def detect_entities(self, text: str, language: str) -> List[str]:
        response = comprehend_client.detect_entities(
            Text=text,
            LanguageCode=language,
        )
        entities = []
        for i in response["Entities"]:
            entities.append(i["Text"])
        return entities

    # URLを抽出
    def extract_urls(self, text_list: List[str]) -> List[str]:
        # 「http://」or「https://」から始まる文字列を取得する正規表現
        url_regex = r"(https?://\S+)"
        urls = []
        for text in text_list:
            urls.extend(re.findall(url_regex, text))
        return urls

    # urlsを返す
    def comprehend(self, text: str) -> Tuple[str, List[str]]:
        language: str = self.detect_language(text)
        entities: List[str] = self.detect_entities(text, language)
        urls: List[str] = self.extract_urls(entities)
        return urls

    #############################################################
    # URLのリストからWebスクレイピングし、テキストのリストを返す処理 #
    #############################################################
    # ページ読み込み待機1
    def wait_for_page_load(self, driver: WebDriver, timeout: int = 60) -> bool:
        try:
            WebDriverWait(driver, timeout).until(lambda d: d.execute_script("return document.readyState") == "complete")
            return True
        except TimeoutException:
            return False

    # ページ読み込み待機2
    def wait_for_content(self, driver: WebDriver, timeout: int = 60) -> bool:
        try:
            WebDriverWait(driver, timeout).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            WebDriverWait(driver, timeout).until(lambda d: d.find_element(By.TAG_NAME, "body").text != "")
            return True
        except TimeoutException:
            return False

    # Webスクレイピング
    def get_page_content(self, driver: WebDriver) -> str:
        script = """
        function extractContent(element) {
            if (element.nodeType === Node.TEXT_NODE) {
                return element.textContent.trim();
            }
            if (element.nodeType !== Node.ELEMENT_NODE) {
                return '';
            }
            if (['script', 'style', 'noscript', 'iframe', 'img'].includes(element.tagName.toLowerCase())) {
                return '';
            }
            let content = '';
            for (let child of element.childNodes) {
                content += extractContent(child) + ' ';
            }
            return content.trim();
        }
        
        const mainContent = document.querySelector('main') || document.querySelector('article') || document.body;
        return extractContent(mainContent);
        """
        content = driver.execute_script(script)
        content = re.sub(r"\s+", " ", content)
        # content = re.sub(r"(https?://\S+)", "", content)
        content = re.sub(r"[^\w\s\.\,\:\;\!\?\-]", "", content)
        return content.strip()

    # chrome初期化 & Webスクレイピング内容を返す
    def web_scraping(self, urls: List[str]) -> List[str]:
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-web-security")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        service = Service("/app/code/chromedriver")
        driver = webdriver.Chrome(service=service, options=chrome_options)
        # driver = webdriver.Chrome(options=chrome_options)
        driver.set_page_load_timeout(60)
        web_scraping_text_list = []
        for url in urls:
            driver.get(url)
            web_scraping_text_list.append(url)
            if self.wait_for_page_load(driver) and self.wait_for_content(driver):
                time.sleep(5)
                content = self.get_page_content(driver)
                web_scraping_text_list.append(content)
            else:
                print(f"Failed to load content for {url}")
        driver.quit()
        return web_scraping_text_list

    ######################
    # 生成AIに質問する処理 #
    ######################
    def llm(self):
        llm = ChatBedrock(
            streaming=True,
            client=bedrock_runtime_client,
            model_id="anthropic.claude-3-haiku-20240307-v1:0",
            model_kwargs={
                "max_tokens": 3800,
            },
            config=config,
            # callbacks=[self.streamlit_handler],
        )
        return llm

    # def memory(self):
    #     memory = ConversationBufferMemory(return_messages=True)
    #     return memory

    # def get_session_history(self, session_id: str) -> BaseChatMessageHistory:
    #     if session_id not in self.store:
    #         self.store[session_id] = ChatMessageHistory()
    #     return self.store[session_id]

    # def generate(self, session_id, llm, prompt: str):
    #     runnable = self.prompt_template | llm
    #     runnable_with_history = RunnableWithMessageHistory(
    #         runnable=runnable,
    #         get_session_history=self.get_session_history,
    #         input_messages_key="input",
    #         output_messages_key="output",
    #         history_messages_key="history",
    #     )
    #     response_stream = runnable_with_history.stream(
    #         {"input": prompt},
    #         config={"configurable": {"session_id": session_id}},
    #     )
    #     full_response = ""
    #     for chunk in response_stream:
    #         if hasattr(chunk, "content") and chunk.content is not None:
    #             full_response += chunk.content
    #             yield chunk.content
    #     self.get_session_history(session_id).add_user_message(prompt)
    #     self.get_session_history(session_id).add_ai_message(full_response)
    #     return full_response
