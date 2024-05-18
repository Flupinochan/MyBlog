import React, { useState } from "react";
import axios from "axios";

import PositivePrompt from "./tool/PositivePrompt";

const GetKB: React.FC = () => {
  const [kb, setKb] = useState("");
  const [s3File, setS3File] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (prompt: string) => {
    const postData = {
      input_prompt: prompt,
    };
    const postConfig = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const url = "https://www.metalmental.net/api/getkb";
    axios.post(url, postData, postConfig).then((response) => {
      setKb(response.data.text);
      setSubmitted(true);
      setS3File(response.data.s3FileName);
      console.log(response.data);
    });
  };

  return (
    <div>
      <h2>Knowledge Base</h2>
      <div className="blogContentBackColor">
        <br />
        <p>{kb}</p>
        {submitted && s3File && <p>Referenced file: {s3File}</p>}
        <br />
        <PositivePrompt onChange={handleSubmit} />
      </div>
    </div>
  );
};

export default GetKB;
