import streamlit as st

st.set_page_config(
    page_title="Metalmental Streamlit",
)

import cbot_frontend
import rag_frontend

PAGES = {
    "Chat Bot": cbot_frontend,
    "RAG": rag_frontend,
}

st.sidebar.title("Navigation")
selection = st.sidebar.radio("Go to", list(PAGES.keys()), index=list(PAGES.keys()).index("Chat Bot"))

page = PAGES[selection]
page.Frontend()
