import React, { useRef, useState, useEffect } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import TextareaAutosize from "react-textarea-autosize";
import styled from "styled-components";
import Button from "@mui/material/Button";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";

import GenImage from "../GenImage";

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
  padding-right: 95px;
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

interface Props {
  onChange: (value: string) => void;
  buttonDisabled: boolean;
}

const PositivePrompt: React.FC<Props> = (Props) => {
  const [value, setValue] = useState("");
  const [spinner, setSpinner] = useState<true | false>(false);
  // setSpinner(Props.buttonDisabled);
  useEffect(() => {
    setSpinner(Props.buttonDisabled);
  }, [Props.buttonDisabled]);

  const handleChangeValue = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(evt.target.value);
  };

  const posiPromptRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div>
      <ThemeProvider theme={theme}>
        <Container>
          <StyledTextarea ref={posiPromptRef} value={value} onChange={handleChangeValue} placeholder="Input Prompt..." />
          <StyledUploadButton variant="contained" startIcon={<ArrowCircleUpIcon onClick={() => Props.onChange(value)} />} disabled={spinner}>
            exe
          </StyledUploadButton>
          {/* <ArrowCircleUpIcon onClick={() => Props.onChange(value)} fontSize="small" /> */}
          {/* </StyledUploadButton> */}
        </Container>
      </ThemeProvider>
    </div>
  );
};

export default PositivePrompt;
