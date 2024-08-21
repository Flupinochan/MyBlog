import streamlit as st
import uuid
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.callbacks.streamlit import StreamlitCallbackHandler
from langchain_core.messages import HumanMessage, AIMessage
from search_backend import Backend


class Frontend:
    def __init__(self):
        self.prompt_template = ChatPromptTemplate.from_messages(
            [
                MessagesPlaceholder(variable_name="history"),
                ("human", "{input}"),
            ]
        )
        bk = Backend()
        st.title("Realtime Search")

        # セッションIDの生成
        if "session_id" not in st.session_state:
            st.session_state.session_id = str(uuid.uuid4())

        # LLM初期化
        if "llm" not in st.session_state:
            st.session_state.llm = bk.llm()

        # store初期化
        if "store" not in st.session_state:
            st.session_state.store = {}

        # チャット履歴を表示
        for message in self.get_session_history(st.session_state.session_id).messages:
            role = "human" if isinstance(message, HumanMessage) else "assistant"
            with st.chat_message(role):
                st.markdown(message.content)

        # ユーザ入力
        if prompt := st.chat_input("What is up?"):
            # ユーザ入力チャットを表示
            with st.chat_message("human"):
                st.markdown(prompt)

            # 生成AIのチャットを表示
            with st.chat_message("assistant"):
                with st.spinner("処理中..."):
                    # ユーザ入力からURLを抽出
                    urls_list = bk.comprehend(prompt)
                    if urls_list:
                        urls_text = ", ".join(urls_list)
                        st.write(f"検索中のURL: {urls_text}")
                        # Webスクレイピングを実行
                        web_scraping_list = bk.web_scraping(urls_list)
                        web_scraping_text = "\n".join(web_scraping_list)
                        prompt = f"Webスクレイピング内容:\n{web_scraping_text}\n質問内容:\n{prompt}"

                    # 生成AIチャット出力
                    message_placeholder = st.empty()
                    full_response = ""
                    for chunk in self.generate(st.session_state.session_id, st.session_state.llm, prompt):
                        full_response += chunk
                        message_placeholder.markdown(full_response)

    def get_session_history(self, session_id: str) -> BaseChatMessageHistory:
        if session_id not in st.session_state.store:
            st.session_state.store[session_id] = ChatMessageHistory()
        return st.session_state.store[session_id]

    # メッセージを生成しつつ、get_session_historyのstoreにメッセージを保存
    def generate(self, session_id, llm, prompt: str):
        runnable_with_history = RunnableWithMessageHistory(
            runnable=self.prompt_template | llm,
            get_session_history=self.get_session_history,
            input_messages_key="input",
            output_messages_key="output",
            history_messages_key="history",
        )

        response_stream = runnable_with_history.stream(
            {"input": prompt},
            config={"configurable": {"session_id": session_id}},
        )

        full_response = ""
        for chunk in response_stream:
            if hasattr(chunk, "content") and chunk.content is not None:
                full_response += chunk.content
                yield chunk.content

        return full_response
