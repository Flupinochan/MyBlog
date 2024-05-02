import React, { useRef, useState } from "react";
// import TextareaAutosize from "react-textarea-autosize";
import styled from "styled-components";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Button from "@mui/material/Button";
// import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
// import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import axios, { AxiosResponse } from "axios";

import "./GenImage.css";
import StepsSlider from "./tool/StepsSlider";
import PositivePrompt from "./tool/PositivePrompt";
import CfgScale from "./tool/CfgScale";
import Size from "./tool/Size";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4c54c0",
    },
  },
});

const StyledDownloadButton = styled(Button)`
  float: right;
`;

// メイン
const GenImage: React.FC = () => {
  const [download, setDownload] = useState("");
  const [image, setImage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  let sizeValue: number;
  let stepsValue: number;
  let cfgScaleValue: number;
  let positivePromptValue: string;

  interface ApiResponse {
    statusCode: number;
    downloadURL: string;
    image: string;
  }

  // const handleSubmit = () => {
  //   setSubmitted(true);
  //   axios
  //     .get(
  //       `https://www.metalmental.net/api/imagegen?positive_prompt=${value}&negative_prompt=none`
  //     )
  //     .then((response: AxiosResponse<ApiResponse>) => {
  //       setDownload(response.data.downloadURL);
  //       setImage(response.data.image);
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //     });
  // };

  const handleSubmit = (positivePromptValue: string) => {
    setSubmitted(true);
    const postData = {
      positive_prompt: positivePromptValue,
      negative_prompt: "none",
      size: sizeValue,
      steps: stepsValue,
      cfg_scale: cfgScaleValue,
    };
    const postConfig = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const url = "https://www.metalmental.net/api/imagegen";
    axios
      // .get(
      //   `https://www.metalmental.net/api/imagegen?positive_prompt=${value}&negative_prompt=none`
      // )
      .post(url, postData, postConfig)
      .then((response: AxiosResponse<ApiResponse>) => {
        setDownload(response.data.downloadURL);
        setImage(response.data.image);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  const handleSizeChange = (size: number) => {
    sizeValue = size;
  };

  const handleStepsSliderChange = (steps: number) => {
    stepsValue = steps;
  };
  const handleCfgScaleChange = (cfgScale: number) => {
    cfgScaleValue = cfgScale;
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
            <ThemeProvider theme={theme}>
              <Size onChange={handleSizeChange} />
              <StepsSlider onChange={handleStepsSliderChange} />
              <CfgScale onChange={handleCfgScaleChange} />
            </ThemeProvider>
          </div>
        </div>
        <PositivePrompt onChange={handleSubmit} />
      </div>
    </div>
  );
};

export default GenImage;
