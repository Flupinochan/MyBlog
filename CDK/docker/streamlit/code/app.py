import streamlit as st
import base64

# CORSアクセスを許可する設定
# 圧縮するかどうかも重要
# https://docs.streamlit.io/knowledge-base/deploy/remote-start#symptom-2-the-app-says-please-wait-or-shows-skeleton-elements-forever
st.set_page_config(
    page_title="Metalmental Streamlit",
    page_icon="../content/favicon.png",
    menu_items={
        "Get Help": None,
        "Report a bug": None,
        "About": None,
    },
)

import cbot_frontend
import rag_frontend
import search_frontend

PAGES = {
    "Chat Bot": cbot_frontend,
    "RAG": rag_frontend,
    "Realtime Search": search_frontend,
}
image = base64.b64encode(open("../content/MetalMental_Blog.png", "rb").read()).decode()

selection = st.sidebar.radio("メニュー", list(PAGES.keys()), index=list(PAGES.keys()).index("Chat Bot"))
PAGES[selection].Frontend()
