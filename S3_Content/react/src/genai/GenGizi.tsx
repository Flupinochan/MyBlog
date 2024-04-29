import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import TranscribeIcon from "@mui/icons-material/Transcribe";
import axios from "axios";

import "./GenGizi.css";
import { Hearing } from "@mui/icons-material";

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
  const [wsStatus, setWsStatus] = useState<WebSocket | null>(null);
  const [message, setMessage] = useState<string[]>([]);

  useEffect(() => {
    // const wsURL = 'wss://lsdujzk2f5.execute-api.us-west-2.amazonaws.com/websocket/';
    const wsURL = "wss://www.metalmental.net/websocket/";
    const ws = new WebSocket(wsURL);

    const initWebSocket = () => {
      ws.onopen = (event) => {
        console.log("ws opended", event);
      };
      ws.onmessage = (event: MessageEvent) => {
        console.log("ws sendMessage", event);
        const data = event.data;
        setMessage((prevMessages) => [...prevMessages, data]);
      };
      ws.onclose = (event) => {
        console.log("ws closed", event);
        setWsStatus(null);
        setTimeout(initWebSocket, 1000);
      };

      setWsStatus(ws);

      return () => {
        ws.close();
        console.log("ws closed");
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

      axios
        .get(url)
        .then((response) => {
          const downloadURL = response.data.downloadURL;
          // put
          return axios.put(downloadURL, uploadFile);
        })
        .then((response) => {
          // ws send
          if (uploadFileName !== null) {
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

  return (
    <div>
      <h2>Generate Giziroku</h2>
      <div className="blogContentBackColor">
        <ThemeProvider theme={theme}>
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
          >
            Upload file
            <VisuallyHiddenInput
              type="file"
              accept="audio/mp4, audio/mpeg, audio/ogg, audio/wav, audio/webm, video/mp4, video/ogg, video/webm"
              onChange={handleFileUpload}
            />
          </Button>
          {uploadFile && (
            <div>
              <p>upload file: {uploadFileName}</p>
              <Button
                variant="contained"
                startIcon={<TranscribeIcon />}
                onClick={handleExecuteTranslation}
              >
                Execute translation
              </Button>
            </div>
          )}
        </ThemeProvider>
      </div>
    </div>
  );
};

export default GenGizi;
