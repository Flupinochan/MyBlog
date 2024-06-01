import React, { useState, useRef } from "react";
import axios from "axios";

import TextareaAutosize from "react-textarea-autosize";

const Profile: React.FC = () => {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = () => {
    console.log("send start");
    const name = nameRef.current!.value;
    const email = emailRef.current!.value;
    const message = messageRef.current!.value;
    if (name && email && message) {
      const postData = {
        name: name,
        email: email,
        message: message,
      };
      const postConfig = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const url = "https://www.metalmental.net/api/ses";
      axios
        .post(url, postData, postConfig)
        .then((res) => {
          console.log("send success");
          setErrorMessage("送信しました");
        })
        .catch((err) => {
          console.log("send error");
          setErrorMessage("送信に失敗しました");
        });
    } else {
      console.log("send error");
      setErrorMessage("空欄があります");
    }
  };
  return (
    <div className="opacity-0 animate-fadeincontentProfile">
      <div className="flex flex-wrap md:flex-nowrap items-center justify-center">
        <div className="text-center w-1024 py-10">
          <h1
            className="font-bold text-5xl
          lg:text-7xl lg:pt-40 
          md:text-5xl md:pt-24"
          >
            TailwindCSSで
            <br />
            美しいサイトを
            <br />
            作ります
          </h1>
        </div>
        <img
          className="
        lg:pt-20 lg:w-auto lg:h-1024 
        md:pt-10 md:w-auto md:h-512 md:pr-5
        w-auto h-512
        "
          src="/images/big_image.png"
          alt="profileImage"
        />
      </div>
      <div className="flex justify-center text-center">
        <h2 className="relative text-3xl font-bold w-auto pt-20">
          お問合せ
          <span className="absolute h-1 bg-font-color1 rounded-full w-96 -bottom-5 -left-32" />
        </h2>
      </div>
      <div className="w-full grid justify-items-center lg:grid-cols-2 gap-8 lg:gap-64 mt-16">
        <div className="justify-self-end space-y-12 w-72">
          <div>
            <label className="block mb-5 text-xl font-bold">お名前</label>
            <input ref={nameRef} type="text" className="input-textarea" />
          </div>
          <div>
            <label className="block mb-5 text-xl font-bold">メールアドレス</label>
            <input ref={emailRef} type="text" className="input-textarea" />
          </div>
          <div>
            <label className="block mb-5 text-xl font-bold">メッセージ</label>
            <TextareaAutosize ref={messageRef} className="input-textarea" />
          </div>
          {errorMessage && <div className="font-bold text-right">{errorMessage}</div>}
          <div className="text-right">
            <button onClick={handleSubmit} className="bg-font-color1 px-8 py-3 text-white rounded-lg font-bold hover:bg-font-color2 hover:text-font-color1 transition-all duration-300">
              送信する
            </button>
          </div>
        </div>
        <div className="justify-self-start">
          <div className="mt-20 space-x-6">
            <a href="mailto:flupino@metalmental.net">
              <i className="text-3xl fa-solid fa-envelope" />
            </a>
            <a href="https://github.com/Flupinochan">
              <i className="text-3xl fa-brands fa-github" />
            </a>
            <a href="https://www.youtube.com/@Flupinochan">
              <i className="text-3xl fa-brands fa-youtube" />
            </a>
          </div>
        </div>
      </div>
      <div className="pb-48"></div>
    </div>
  );
};

export default Profile;
