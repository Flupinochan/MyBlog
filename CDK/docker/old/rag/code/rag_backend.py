import os
import boto3
from botocore.config import Config
from langchain_community.document_loaders.pdf import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_aws import BedrockEmbeddings
from langchain_aws import BedrockChat
from langchain_community.vectorstores import FAISS  # Facebookのベクトルストア
from langchain.indexes import VectorstoreIndexCreator
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

os.environ["OPENAI_API_KEY"] = "dummy_key"
os.environ["PROMPTLAYER_API_KEY"] = "dummy_key"


# xray_recorder.configure(
#     plugins=("EC2Plugin", "ECSPlugin"),
#     daemon_address="127.0.0.1:2000",
#     service="rag-backend",
# )
# patch_all()


class Backend:
    config = Config(
        retries={"max_attempts": 30, "mode": "standard"},
        read_timeout=900,
        connect_timeout=900,
    )

    # @xray_recorder.capture("create_embedded_index")
    def create_embedded_index(self, file_path):
        loader = PyPDFLoader(file_path)
        text_splitter = RecursiveCharacterTextSplitter(
            separators=["\n\n", "\n", " ", ""],
            chunk_size=100,
            chunk_overlap=10,
        )
        model_id = "amazon.titan-embed-text-v2:0"
        # bedrock_client = boto3.client("bedrock", config=self.config)
        embeddings = BedrockEmbeddings(
            model_id=model_id,
            # client=bedrock_client,
        )

        index = VectorstoreIndexCreator(
            text_splitter=text_splitter,
            embedding=embeddings,
            vectorstore_cls=FAISS,
        ).from_loaders([loader])

        return index

    # @xray_recorder.capture("llm_setting")
    def llm_setting(self):
        model_id = "anthropic.claude-3-opus-20240229-v1:0"
        llm = BedrockChat(
            model_id=model_id,
            model_kwargs={
                "max_tokens": 3000,
                "temperature": 0.1,
                "top_k": 250,
                "top_p": 0.9,
            },
            streaming=True,
            config=self.config,
        )
        return llm

    # @xray_recorder.capture("rag_query")
    def rag_query(self, llm, index, question):
        response = index.query(llm=llm, question=question)
        return response
