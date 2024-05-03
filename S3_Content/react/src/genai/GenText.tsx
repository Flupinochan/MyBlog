import React, { useState } from "react";
import axios, { AxiosResponse } from "axios";

import PositivePrompt from "./tool/PositivePrompt";

interface ApiResponse {
  statusCode: number;
  text: string;
}

const GenText: React.FC = () => {
  const [text, setText] = useState("");

  const handleSubmit = (positivePromptValue: string) => {
    const postData = {
      positive_prompt: positivePromptValue,
    };
    console.log(postData);
    const postConfig = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const url = "https://www.metalmental.net/api/textgen";
    axios
      .post(url, postData, postConfig)
      .then((response: AxiosResponse<ApiResponse>) => {
        setText(response.data.text);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <div>
      <h2>Generate Text</h2>
      <div className="blogContentBackColor">
        <p>
          This is the generate text page with <b>cohere</b>
        </p>
        <p>{text}</p>
        <PositivePrompt onChange={handleSubmit} />
      </div>
    </div>
  );
};

export default GenText;
