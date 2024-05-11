import streamlit as st
import base64

st.set_page_config(
    page_title="Metalmental Streamlit",
    page_icon="./content/favicon.png",
    menu_items={
        "Get Help": None,
        "Report a bug": None,
        "About": None,
    },
)

import cbot_frontend
import rag_frontend

PAGES = {
    "Chat Bot": cbot_frontend,
    "RAG": rag_frontend,
}
image = base64.b64encode(open("./content/MetalMental_Blog.png", "rb").read()).decode()

st.sidebar.markdown(
    f"""<a href="https://www.metalmental.net/">
    <img src="data:image/png;base64,{image}" style="max-width: 100%; height: auto;">
    </a>""",
    unsafe_allow_html=True,
)
selection = st.sidebar.radio("", list(PAGES.keys()), index=list(PAGES.keys()).index("Chat Bot"))
PAGES[selection].Frontend()
