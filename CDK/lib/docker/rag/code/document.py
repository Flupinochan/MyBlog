import os
import boto3
from botocore.config import Config
from langchain_community.document_loaders.pdf import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_aws import BedrockEmbeddings
from langchain_community.vectorstores import FAISS  # Facebookのベクトルストア
from langchain.indexes import VectorstoreIndexCreator


# LangChain Document Loadersを使用し、ファイル形式に合ったファイルをメモリにロードする
# https://python.langchain.com/docs/modules/data_connection/document_loaders/pdf/
loader = PyPDFLoader("https://www.upl-ltd.com/images/people/downloads/Leave-Policy-India.pdf")
# pages = loader.load_and_split()  # 配列の1要素に1ページとして格納
# print(pages[2])  # 3ページ目を出力

# Text Splittersで、データを小さく分割する
# chunk_size(分割する文字数)が小さいほど、文章が多くの,で区切られた配列になる
# 100なら100文字ごとに分割される
text_splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", " ", ""],
    chunk_size=100,
    chunk_overlap=10,
)
sample_text = "This text splitter is the recommended one for generic text. It is parameterized by a list of characters. It tries to split on them in order until the chunks are small enough. The default list is . This has the effect of trying to keep all paragraphs (and then sentences, and then words) together as long as possible, as those would generically seem to be the strongest semantically related pieces of text."
split_sample_text = text_splitter.split_text(sample_text)
print(split_sample_text)

# 文字列をembeddings(ベクトルに変換)する
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

# ベクトルストアに直接アクセスするのではなく、インデックスを経由してアクセスする必要がある
# インデックスの作成には、以下3つが必要
# 1. embeddingsモデル
# 2. test splitter(分割した文字列)
# 3. ベクトルストア
index = VectorstoreIndexCreator(
    text_splitter=text_splitter,
    embeddings=embeddings,
    vectorstore_cls=FAISS,
)
