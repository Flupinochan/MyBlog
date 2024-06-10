import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { styled } from "@mui/material/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import TranscribeIcon from "@mui/icons-material/Transcribe";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { duotoneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import ReactLoading from "react-loading";
import "@aws-amplify/ui-react/styles.css";
// https://k8shiro.github.io/ReactCompareCodeHighlighter/

// import "./GenGizi.css";
import { getRum } from "../CloudWatchRUM";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4c54c0",
    },
  },
});

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const GenGizi: React.FC = () => {
  const location = useLocation();
  React.useEffect(() => {
    const cwr = getRum();
    if (!cwr) return;
    console.log("logging pageview to cwr: " + location.pathname);
    cwr.recordPageView(location.pathname);
  }, [location]);
  const [wsStatus, setWsStatus] = useState<WebSocket | null>(null);
  const [message, setMessage] = useState<string[]>([]);

  const [spinner1, setSpinner1] = useState<true | false>(false);

  useEffect(() => {
    const wsURL = "wss://www.metalmental.net/websocket/";
    const initWebSocket = () => {
      const ws = new WebSocket(wsURL);

      ws.onopen = (event) => {
        console.log("ws opended", event);
      };
      ws.onmessage = (event: MessageEvent) => {
        const data = event.data;
        if (!data.includes("Endpoint request timed out")) {
          setSpinner1(false);
          setMessage((prevMessages) => [...prevMessages, data]);
        }
      };
      ws.onclose = (event) => {
        console.log("ws closed", event);
        setWsStatus(null);
        setTimeout(initWebSocket, 1000);
      };

      setWsStatus(ws);

      return () => {
        if (wsStatus) {
          ws.close();
          console.log("ws closed");
        }
      };
    };
    initWebSocket();
  }, []);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files![0];
    setUploadFileName(file.name);
    setUploadFile(file);
  };

  const handleExecuteTranslation = () => {
    if (uploadFile && wsStatus) {
      const url = `https://www.metalmental.net/api/movieupload?file_name=${uploadFileName}`;

      setSpinner1(true);
      axios
        // get s3 pre signed url
        .get(url)
        .then((response) => {
          const downloadURL = response.data.downloadURL;
          // s3 put
          return axios.put(downloadURL, uploadFile);
        })
        .then((response) => {
          // ws send
          if (uploadFileName !== null) {
            setMessage((prevMessages) => []);
            wsStatus.send(uploadFileName);
          }
        })
        .catch((error) => {
          console.log(error);
        });
      // const reader = new FileReader();
      // // 2.ファイル読み込み後に実行
      // reader.onload = () => {
      //   // 読み込んだデータをバイナリからbase64文字列にし、sendで送信
      //   const base64data = reader.result as string;
      //   wsStatus.send(base64data);
      //   console.log("websocket send");
      // };
      // // 1.ファイル読み込み
      // reader.readAsDataURL(uploadFile);
    }
  };

  // マークダウンハイライト用
  //   anOldHope
  // vs2015
  // shadesOfPurple
  interface CodeProps {
    node?: any;
    inline?: any;
    className?: any;
    children?: any;
  }

  return (
    <div>
      <h2 className="animate-slidelefth2 custom-h2">Generate Giziroku</h2>
      <div className="custom-content-box opacity-0 animate-fadeincontent">
        <br />
        <ThemeProvider theme={theme}>
          {spinner1 && <ReactLoading type={"spin"} color={"#4c54c0"} height={100} width={100} />}
          <Button component="label" role={undefined} variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
            Upload Movie
            <VisuallyHiddenInput type="file" accept="audio/mp4, audio/mpeg, audio/ogg, audio/wav, audio/webm, video/mp4, video/ogg, video/webm" onChange={handleFileUpload} />
          </Button>
          {uploadFile && (
            <div>
              <p>upload file: {uploadFileName}</p>
              <Button variant="contained" startIcon={<TranscribeIcon />} onClick={handleExecuteTranslation}>
                Execute Transcription
              </Button>
            </div>
          )}
          <br />
        </ThemeProvider>
        <ReactMarkdown
          // className={"markdown"}
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          children={message.join("")}
          components={{
            code(props: CodeProps) {
              const { children, className, node, ...rest } = props;
              const match = /language-(\w+)/.exec(className || "");
              return match ? (
                <SyntaxHighlighter {...rest} PreTag="div" children={String(children).replace(/\n$/, "")} language={match[1]} style={duotoneDark} />
              ) : (
                <code {...rest} className={className}>
                  {children}
                </code>
              );
            },
          }}
        />
        <br />
        <br />
      </div>
    </div>
  );
};

// export default GenGizi;
export default withAuthenticator(GenGizi);
