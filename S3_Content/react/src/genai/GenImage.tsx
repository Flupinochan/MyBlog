import React, { useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import styled from "styled-components";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Button from "@mui/material/Button";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
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

const StyledButton = styled(Button)`
  bottom: 48px;
  right: 7px;
  float: right;
`;

// メイン
const GenImage: React.FC = () => {
  const [value, setValue] = useState("");
  const [posiPromptData, setPosiPromptData] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleChangeValue = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(evt.target.value);
  };

  const posiPromptRef = useRef<HTMLTextAreaElement>(null);

  interface ApiResponse {
    statusCode: number;
    body: string;
  }

  const handleSubmit = () => {
    setSubmitted(true);
    axios
      .get(
        `https://www.metalmental.net/api/imagegen?positive_prompt=${value}&negative_prompt=none`
      )
      .then((response: AxiosResponse<ApiResponse>) => {
        setPosiPromptData(response.data.body);
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
            <p>value :</p>
            {submitted && posiPromptData && (
              <a href={posiPromptData}>
                <ArrowCircleDownIcon />
              </a>
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
            <StyledButton variant="contained">
              <ArrowCircleUpIcon onClick={handleSubmit} fontSize="small" />
            </StyledButton>
          </Container>
        </ThemeProvider>
      </div>
    </div>
  );
};

export default GenImage;
