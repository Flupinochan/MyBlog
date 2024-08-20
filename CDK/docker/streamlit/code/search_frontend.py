import streamlit as st
import uuid
from search_backend import Backend


class Frontend:
    def __init__(self):
        bk = Backend(st.container())
        st.title("Realtime Search")
        # セッションIDの生成
        if "session_id" not in st.session_state:
            st.session_state.session_id = str(uuid.uuid4())
        # LLM初期化
        if "llm" not in st.session_state:
            st.session_state.llm = bk.llm()
        # チャット履歴を表示
        for message in bk.get_session_history(st.session_state.session_id).messages:
            with st.chat_message(message.role):
                st.markdown(message.content)
        # ユーザ入力
        if prompt := st.chat_input("What is up?"):
            # ユーザ入力チャットを表示
            with st.chat_message("user"):
                st.markdown(prompt)
            # 生成AIのチャットを表示
            with st.chat_message("assistant"):
                with st.spinner("処理中..."):
                    # ユーザ入力からURLを抽出
                    urls_list = bk.comprehend(prompt)
                    if urls_list != []:
                        urls_text = ", ".join(urls_list)
                        st.write(f"検索中のURL: {urls_text}")
                        # Webスクレイピングを実行
                        web_scraping_list = bk.web_scraping(urls_list)
                        web_scraping_text = "\n".join(web_scraping_list)
                        prompt = "Webスクレイピング内容: " + "\n" + web_scraping_text + "\n" + "質問内容: " + "\n" + prompt
                    # 生成AIチャット出力
                    message_placeholder = st.empty()
                    full_response = ""
                    for chunk in bk.generate(st.session_state.session_id, st.session_state.llm, prompt):
                        full_response += chunk
                        message_placeholder.markdown(full_response)
