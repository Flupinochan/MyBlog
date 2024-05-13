# modelに応じて、bedrockではなく、openaiなどをimport
# from langchain、langchain_communityなどは非推奨
from langchain_aws import ChatBedrock
from langchain.memory import ConversationBufferMemory
from langchain.chains.conversation.base import ConversationChain
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from botocore.config import Config
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

from LoggingClass import LoggingClass

# メモリについて
# https://book.st-hakky.com/data-science/memory-of-langchain/

xray_recorder.configure(
    plugins=("EC2Plugin", "ECSPlugin"),
    daemon_address="127.0.0.1:2000",
    service="streamlit-backend",
)
patch_all()


class Backend:
    logger = LoggingClass("DEBUG")
    log = logger.get_logger()
    config = Config(
        retries={"max_attempts": 30, "mode": "standard"},
        read_timeout=900,
        connect_timeout=900,
    )

    @xray_recorder.capture("llm_setting")
    def llm_setting(self):
        try:
            model_id = "anthropic.claude-3-opus-20240229-v1:0"
            llm = ChatBedrock(
                model_id=model_id,
                model_kwargs={
                    "max_tokens": 1024,
                    "temperature": 0.9,
                    "top_k": 250,
                    "top_p": 0.9,
                },
                streaming=True,
                config=self.config,
            )
            return llm
        except Exception as e:
            self.log.error(f"エラーが発生しました: {e}")
        raise

    @xray_recorder.capture("llm_memory")
    def llm_memory(self, llm):
        try:
            memory = ConversationBufferMemory(
                llm=llm,
                max_token_limit=2048,
            )
            return memory
        except Exception as e:
            self.log.error(f"エラーが発生しました: {e}")

    @xray_recorder.capture("llm_chain")
    def llm_chain(self, llm, memory):
        try:
            chain = ConversationChain(llm=llm, memory=memory)
            return chain
        except Exception as e:
            self.log.error(f"エラーが発生しました: {e}")

    # def llm_chat(chain, text):
    #     stream_response = chain.stream(text)
    #     for chunk in stream_response:
    #         print(chunk["response"], end="", flush=True)
    # response = chain.invoke(text)
    # return response