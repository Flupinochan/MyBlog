import streamlit as st

from LoggingClass import LoggingClass
from backend import Backend

bk = Backend()
llm = bk.llm_setting()
memory = bk.llm_memory(llm)


class Frontend:
    def __init__(self):
        st.title("Claude3 Chatbot")
        if "memory" not in st.session_state:
            st.session_state["memory"] = memory
        if "chat_history" not in st.session_state:
            st.session_state["chat_history"] = []
        for message in st.session_state["chat_history"]:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])
        input_text = st.chat_input("Input here")
        if input_text:
            with st.chat_message("user"):
                st.markdown(input_text)
            st.session_state["chat_history"].append({"role": "user", "content": input_text})
            chain = bk.llm_chain(llm, st.session_state["memory"])
            chat_response = chain.stream(input_text)
            response = ""
            placeholder = st.empty()
            for chunk in chat_response:
                with st.chat_message("assistant"):
                    response += chunk["response"]
                    placeholder.markdown(chunk["response"])
                st.session_state["chat_history"].append({"role": "assistant", "content": response})


Frontend()
