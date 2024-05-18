import React, { useState } from "react";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { styled } from "@mui/material/styles";

interface Props {
  onChange: (file: File) => void;
}

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

const UploadButton: React.FC<Props> = (props) => {
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files![0];
    setUploadFileName(file.name);
    props.onChange(file); // return value
  };

  return (
    <div>
      {uploadFileName && <p>Upload File Name: {uploadFileName}</p>}
      <ThemeProvider theme={theme}>
        <Button component="label" role={undefined} variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
          Upload File
          <VisuallyHiddenInput onChange={handleFileUpload} type="file" accept="text/html, text/markdown, text/plain, text/csv, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
        </Button>
      </ThemeProvider>
      <br />
      <br />
    </div>
  );
};

export default UploadButton;
