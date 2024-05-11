import os
import streamlit as st

from rag_backend import Backend

from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# xray_recorder.configure(
#     plugins=("EC2Plugin", "ECSPlugin"),
#     daemon_address="127.0.0.1:2000",
#     service="rag-frontend",
# )
# patch_all()

bk = Backend()


class Frontend:
    def __init__(self):
        llm = bk.llm_setting()
        title = '<h1 style="font-family:sans-serif; font-size: 42px;">Amazon Titan2 RAG</h1>'
        st.markdown(body=title, unsafe_allow_html=True)
        file = st.file_uploader("Upload your pdf file or text file", type=["pdf"])

        if st.button("Create Index", type="primary"):
            with st.spinner("Creating vector index..."):
                file_path = "tmp.pdf"
                with open(file_path, "wb") as f:
                    f.write(file.getvalue())
                st.session_state.vector_index = bk.create_embedded_index(file_path)
                if os.path.exists(file_path):
                    os.remove(file_path)

        input_question = st.text_area("Input Question", label_visibility="collapsed")

        if st.button("Search Index", type="primary"):
            with st.spinner("Searching..."):
                response = bk.rag_query(
                    llm=llm,
                    index=st.session_state.vector_index,
                    question=input_question,
                )
                st.write(response)


# Frontend()
