import React, { useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import styled from "styled-components";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
// import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import axios, { AxiosResponse } from "axios";

import "./GenImage.css";

// TextArea用
const Container = styled.div`
  position: relative;
  width: 100%;
  height: auto;
`;

const theme = createTheme({
  palette: {
    primary: {
      main: "#4c54c0",
    },
  },
});

const StyledTextarea = styled(TextareaAutosize)`
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
  padding: 13px;
  padding-right: 75px;
  font-size: 18px;
  color: #4c54c0;
  background-color: #f7f7f7;
  border: 2px solid #ccc;
  border-radius: 5px;
  outline: none;
  transition: border-color 0.3s;
  box-sizing: border-box;
  resize: none;

  &:focus {
    border-color: #4c54c0;
    background-color: white;
  }
`;

const StyledUploadButton = styled(Button)`
  bottom: 48px;
  right: 7px;
  float: right;
`;

const StyledDownloadButton = styled(Button)`
  float: right;
`;

// メイン
const GenImage: React.FC = () => {
  const [value, setValue] = useState("");
  const [download, setDownload] = useState("");
  const [image, setImage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleChangeValue = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(evt.target.value);
  };

  const posiPromptRef = useRef<HTMLTextAreaElement>(null);

  interface ApiResponse {
    statusCode: number;
    downloadURL: string;
    image: string;
  }

  const handleSubmit = () => {
    setSubmitted(true);
    axios
      .get(
        `https://www.metalmental.net/api/imagegen?positive_prompt=${value}&negative_prompt=none`
      )
      .then((response: AxiosResponse<ApiResponse>) => {
        setDownload(response.data.downloadURL);
        setImage(response.data.image);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <div>
      <h2>Generate Image</h2>
      <div className="blogContentBackColor">
        <div className="wrap">
          <div className="left">
            {submitted && image && (
              <img src={`data:image/png;base64,${image}`} alt="createdImage" />
            )}
            <br />
            {submitted && download && (
              <ThemeProvider theme={theme}>
                <StyledDownloadButton variant="contained">
                  <a id="download_button" href={download}>
                    Download
                  </a>
                </StyledDownloadButton>
              </ThemeProvider>
            )}
          </div>
          <div className="right">
            <p>test2</p>
          </div>
        </div>
        <ThemeProvider theme={theme}>
          <Container>
            <StyledTextarea
              ref={posiPromptRef}
              value={value}
              onChange={handleChangeValue}
              placeholder="Input Prompt..."
            />
            <StyledUploadButton variant="contained">
              <ArrowCircleUpIcon onClick={handleSubmit} fontSize="small" />
            </StyledUploadButton>
          </Container>
        </ThemeProvider>
      </div>
    </div>
  );
};

export default GenImage;
