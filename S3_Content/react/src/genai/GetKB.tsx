import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import PositivePrompt from "./tool/PositivePrompt";
import UploadButton from "./tool/UploadButton";
import { Upload } from "@mui/icons-material";
import { getRum } from "../CloudWatchRUM";
import { upload } from "@testing-library/user-event/dist/upload";

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

  interface Request {
    input_prompt: string;
    operation: string;
    mime_type: string;
  }
  interface Response {
    data: {
      text?: string;
      s3FileName?: string;
      presignedUrl?: string;
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
        setUploadFileName(inputFile.name);
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
    axios.post(url, postData, postConfig).then((response: Response) => {
      setKb(response.data.text!);
      setSubmitted(true);
      setS3File(response.data.s3FileName!);
      console.log(response.data);
    });
  };

  return (
    <div>
      <h2>Knowledge Base</h2>
      <div className="blogContentBackColor">
        <br />
        <UploadButton onChange={handleUploadButton} />
        {uploadFileName && <p>Upload Completed: {uploadFileName}</p>}
        <p>{kb}</p>
        {submitted && s3File && <p>Referenced file: {s3File}</p>}
        <br />
        <PositivePrompt onChange={handleSubmit} />
      </div>
    </div>
  );
};

export default GetKB;
