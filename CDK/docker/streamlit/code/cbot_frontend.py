import streamlit as st
from langchain_community.callbacks import StreamlitCallbackHandler
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

from cbot_backend import Backend
from LoggingClass import LoggingClass

xray_recorder.configure(
    plugins=("EC2Plugin", "ECSPlugin"),
    daemon_address="127.0.0.1:2000",
    service="streamlit-chatbot",
)
patch_all()

bk = Backend()
llm = bk.llm_setting()
memory = bk.llm_memory(llm)


class Frontend:
    def __init__(self):
        xray_recorder.begin_segment("streamlit-chatbot")
        xray_recorder.begin_subsegment("set-up")
        st.title("Claude3 Opus Chatbot")
        if "memory" not in st.session_state:
            st.session_state.memory = memory
        if "chat_history" not in st.session_state:
            st.session_state.chat_history = []
        for message in st.session_state["chat_history"]:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])
        input_text = st.chat_input("Input here")
        xray_recorder.end_subsegment()
        xray_recorder.begin_subsegment("text-generate")
        if input_text:
            with st.chat_message("user"):
                st.markdown(input_text)
            st.session_state.chat_history.append({"role": "user", "content": input_text})
            chain = bk.llm_chain(llm, st.session_state.memory)
            st_cb = StreamlitCallbackHandler(st.empty())
            response = chain.run(input_text, callbacks=[st_cb])
            with st.chat_message("assistant"):
                st.markdown(response)
            st.session_state.chat_history.append({"role": "assistant", "content": response})
        xray_recorder.end_subsegment()
        xray_recorder.end_segment()


# Frontend()
