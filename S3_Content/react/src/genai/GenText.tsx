import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import ReactLoading from "react-loading";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { duotoneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
// import shadesOfPurple from "react-syntax-highlighter/dist/esm/styles/hljs/shades-of-purple";
// import anOldHope from "react-syntax-highlighter/dist/esm/styles/hljs/an-old-hope";
// import vs2015 from "react-syntax-highlighter/dist/esm/styles/hljs/vs2015";
import axios, { AxiosResponse } from "axios";
import CopyToClipBoard from "react-copy-to-clipboard";

import PositivePrompt from "./tool/PositivePrompt";
// import "./GenText.css";
import { getRum } from "../CloudWatchRUM";

interface ApiResponse {
  statusCode: number;
  text: string;
}

interface CodeProps {
  node?: any;
  inline?: any;
  className?: any;
  children?: any;
}

const GenText: React.FC = () => {
  const location = useLocation();
  React.useEffect(() => {
    const cwr = getRum();
    if (!cwr) return;
    console.log("logging pageview to cwr: " + location.pathname);
    cwr.recordPageView(location.pathname);
  }, [location]);

  const [text, setText] = useState("");
  const [spinner, setSpinner] = useState<true | false>(false);

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
    setSpinner(true);
    axios
      .post(url, postData, postConfig)
      .then((response: AxiosResponse<ApiResponse>) => {
        setSpinner(false);
        setText(response.data.text);
      })
      .catch((error) => {
        setSpinner(false);
        console.log(error);
      });
  };

  // https://github.com/react-syntax-highlighter/react-syntax-highlighter
  return (
    <div>
      <h2>Generate Text (Cohere)</h2>
      <div className="blogContentBackColor">
        <br />
        {spinner && <ReactLoading type={"spin"} color={"#4c54c0"} height={100} width={100} />}
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          children={text}
          components={{
            code(props: CodeProps) {
              const { children, className, node, ...rest } = props;
              const match = /language-(\w+)/.exec(className || "");
              return match ? (
                <SyntaxHighlighter {...rest} className={"test"} PreTag="div" children={String(children).replace(/\n$/, "")} language={match[1]} style={duotoneDark} showLineNumbers={true} />
              ) : (
                <code {...rest} className={className}>
                  {children}
                </code>
              );
            },
          }}
        />
        <br />
        <PositivePrompt onChange={handleSubmit} />
      </div>
    </div>
  );
};

export default GenText;
