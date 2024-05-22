import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import ReactLoading from "react-loading";
import axios from "axios";

import PositivePrompt from "./tool/PositivePrompt";
import UploadButton from "./tool/UploadButton";
import UploadButtonDisabled from "./tool/UploadButtonDisabled";
import { getRum } from "../CloudWatchRUM";
import Button from "@mui/material/Button";
import SyncIcon from "@mui/icons-material/Sync";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4c54c0",
    },
  },
});

const GetKB: React.FC = () => {
  const location = useLocation();
  React.useEffect(() => {
    const cwr = getRum();
    if (!cwr) return;
    cwr.recordPageView(location.pathname);
  }, [location]);

  const [kb, setKb] = useState<string | null>(null);
  const [s3File, setS3File] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<true | false>(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [spinner1, setSpinner1] = useState<true | false>(false);
  const [spinner2, setSpinner2] = useState<true | false>(false);
  const [spinner3, setSpinner3] = useState<true | false>(false);

  interface Request {
    input_prompt?: string;
    operation?: string;
    mime_type?: string;
    executionArn?: string;
  }
  interface Response {
    data: {
      text?: string;
      s3FileName?: string;
      presignedUrl?: string;
      executionArn?: string;
    };
  }

  // fileUpload
  const handleUploadButton = (inputFile: File) => {
    const uploadFile = inputFile;
    const postData: Request = {
      input_prompt: uploadFile.name,
      operation: "get_presigned_url",
      mime_type: uploadFile.type,
    };
    const postConfig = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const url = "https://www.metalmental.net/api/getkb";
    setSpinner1(true);
    axios
      .post(url, postData, postConfig)
      .then((response: Response) => {
        const presignedUrl = response.data.presignedUrl!;
        // content-typeを指定しないと403エラーになる
        return axios.put(presignedUrl, uploadFile, {
          headers: {
            "Content-Type": uploadFile.type,
          },
        });
      })
      .then((response) => {
        setSpinner1(false);
        setUploadFileName(inputFile.name);
      })
      .catch((error) => {
        setSpinner1(false);
        console.log(error);
      });
  };

  // Sync Knowledge
  const handleSync = () => {
    const postData1: Request = {
      operation: "sync_kb_start",
    };
    const postConfig = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const url1 = "https://www.metalmental.net/api/execsync";
    const url2 = "https://www.metalmental.net/api/checksync";
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    setSpinner2(true);
    axios
      .post(url1, postData1, postConfig)
      .then((response: Response) => {
        console.log(response);
        const postData2: Request = {
          executionArn: response.data.executionArn!,
          input_prompt: response.data.text!,
          operation: "sync_kb_describe",
        };
        const checkSync = async () => {
          try {
            while (true) {
              const response = await axios.post(url2, postData2, postConfig);
              console.log(response);
              if (response.data.status === "SUCCEEDED") {
                setSyncStatus(response.data.status);
                console.log(response);
                setSpinner2(false);
                break;
              } else if (response.data.status === "FAILED" || response.data.status === "TIMED_OUT") {
                setSyncStatus(response.data.status);
                console.log(response);
                setSpinner2(false);
                throw new Error("Sync Failed");
              }
              setSyncStatus(response.data.status);
              await delay(10000);
            }
          } catch (error) {
            setSpinner2(false);
            console.log(error);
          }
        };
        checkSync();
        // setSpinner2(false); 非同期だからNG
      })
      .catch((error) => {
        setSpinner2(false);
        console.log(error);
      });
  };

  // getKnowledge
  const handleSubmit = (prompt: string) => {
    const postData: Request = {
      input_prompt: prompt,
      operation: "get_knowledge",
      mime_type: "nothing",
    };
    const postConfig = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const url = "https://www.metalmental.net/api/getkb";
    setSpinner3(true);
    axios
      .post(url, postData, postConfig)
      .then((response: Response) => {
        setSpinner3(false);
        setKb(response.data.text!);
        setSubmitted(true);
        setS3File(response.data.s3FileName!);
        console.log(response.data);
      })
      .catch((error) => {
        setSpinner3(false);
        console.log(error);
      });
  };

  return (
    <div>
      <h2>Knowledge Base</h2>
      <div className="blogContentBackColor">
        <ThemeProvider theme={theme}>
          <br />
          {(spinner1 || spinner2 || spinner3) && <ReactLoading type={"spin"} color={"#4c54c0"} height={100} width={100} />}
          {spinner1 ? <UploadButtonDisabled /> : <UploadButton onChange={handleUploadButton} />}
          {uploadFileName && <p>Upload Completed: {uploadFileName}</p>}
          <Button variant="contained" startIcon={<SyncIcon />} onClick={handleSync} disabled={spinner2}>
            Sync KnowledgeBase
          </Button>
          {syncStatus && <p>Sync Status: {syncStatus}</p>}
          <p>{kb}</p>
          {submitted && s3File && <p>Referenced file: {s3File}</p>}
          <br />
          <PositivePrompt onChange={handleSubmit} buttonDisabled={spinner3} />
        </ThemeProvider>
      </div>
    </div>
  );
};

export default GetKB;
