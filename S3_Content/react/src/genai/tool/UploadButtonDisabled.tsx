import React from "react";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { createTheme, ThemeProvider } from "@mui/material/styles";
// import { styled } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4c54c0",
    },
  },
});

const UploadButtonDisabled: React.FC = () => {
  return (
    <div>
      <ThemeProvider theme={theme}>
        <Button variant="contained" startIcon={<CloudUploadIcon />} disabled={true}>
          Upload File
        </Button>
      </ThemeProvider>
      <br />
      <br />
    </div>
  );
};

export default UploadButtonDisabled;
