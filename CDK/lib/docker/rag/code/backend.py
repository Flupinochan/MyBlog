import os
import boto3
from botocore.config import Config
from langchain_community.document_loaders.pdf import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_aws import BedrockEmbeddings
from langchain_community.vectorstores import FAISS  # Facebookのベクトルストア
from langchain.indexes import VectorstoreIndexCreator


def create_embedded_index():
    # LangChain Document Loadersを使用し、PDF形式のファイルをメモリにロード
    loader = PyPDFLoader("https://www.upl-ltd.com/images/people/downloads/Leave-Policy-India.pdf")
    # Text Splittersの定義 (指定した区切り文字やチャンクサイズで文字列を分割)
    text_splitter = RecursiveCharacterTextSplitter(
        separators=["\n\n", "\n", " ", ""],
        chunk_size=100,
        chunk_overlap=10,
    )
    # embeddingsモデルの定義
    model_id = "amazon.titan-embed-text-v2:0"
    config = Config(
        retries={"max_attempts": 30, "mode": "standard"},
        read_timeout=900,
        connect_timeout=900,
    )
    bedrock_client = boto3.client("bedrock", config=config)
    embeddings = BedrockEmbeddings(
        model_id=model_id,
        client=bedrock_client,
    )

    # 文字列をembeddings(ベクトルに変換)し、アクセスするためのindexを作成する
    index = VectorstoreIndexCreator(
        text_splitter=text_splitter,
        embeddings=embeddings,
        vectorstore_cls=FAISS,
    ).from_loaders([loader])

    return index
