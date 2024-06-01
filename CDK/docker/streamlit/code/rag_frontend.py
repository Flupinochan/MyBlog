import os
import chardet
import requests
import streamlit as st
import pandas as pd

from rag_backend import Backend

from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

xray_recorder.configure(
    plugins=("EC2Plugin", "ECSPlugin"),
    daemon_address="127.0.0.1:2000",
    service="streamlit-rag",
)
patch_all()

bk = Backend()


class Frontend:
    def __init__(self):
        xray_recorder.begin_segment("streamlit-rag")
        xray_recorder.begin_subsegment("set-up")
        llm = bk.llm_setting()
        title = '<h1 style="font-family:sans-serif; font-size: 42px;">Amazon Titan2 RAG</h1>'
        st.markdown(body=title, unsafe_allow_html=True)
        file_type = st.selectbox("Select file type", ("pdf", "txt", "html", "Youtube", "Excel"))
        file = ""
        xray_recorder.end_subsegment()
        if file_type == "pdf":
            file = st.file_uploader("Upload pdf file", type=["pdf"])
        elif file_type == "txt":
            file = st.file_uploader("Upload txt file", type=["txt"])
        elif file_type == "html":
            file = st.text_input("Input URL ※React is not supported.")
        elif file_type == "Youtube":
            file = st.text_input("Input Youtube URL")
        elif file_type == "Excel":
            file = st.file_uploader("Upload Excel file", type=["xlsx", "xls"])

        xray_recorder.begin_subsegment("create-index")
        if st.button("Create Index", type="primary"):
            with st.spinner("Creating vector index..."):
                file_path = f"tmp.{file_type}"
                if file_type == "html":
                    response = requests.get(file)
                    if response.status_code == 200:
                        # 文字化けするのでutf-8にする
                        response_encoding = chardet.detect(response.content)["encoding"]
                        print(response_encoding)
                        if response_encoding.lower() == "shift-jis":
                            response = response.content.decode("shift-jis").encode("utf-8")
                            with open(file_path, "w", encoding="utf-8") as f:
                                f.write(response)
                        else:
                            # with open(file_path, "w", encoding="utf-8") as f:
                            # 文字化けしなくても一度エンコードし直す
                            with open(file_path, "wb") as f:
                                response = response.content.decode("utf-8").encode("utf-8")
                                f.write(response)
                elif file_type == "Youtube":
                    file_path = file
                # elif file_type == "Excel":
                #     df = pd.read_excel(file)
                #     df.to_excel(file_path, index=False)
                else:
                    with open(file_path, "wb") as f:
                        f.write(file.getvalue())
                st.session_state.vector_index = None
                st.session_state.vector_index = bk.create_embedded_index(file_path, file_type)
                if os.path.exists(file_path):
                    os.remove(file_path)
        xray_recorder.end_subsegment()
        input_question = st.text_area("Input Question")

        xray_recorder.begin_subsegment("search-index")
        if st.button("Search Index", type="primary"):
            with st.spinner("Searching..."):
                response = bk.rag_query(
                    llm=llm,
                    index=st.session_state.vector_index,
                    question=input_question,
                )
                st.write(response)
        xray_recorder.end_subsegment()
        xray_recorder.end_segment()


# Frontend()
