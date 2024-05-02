import React from "react";
import styled from "styled-components";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import MuiInput from "@mui/material/Input";

interface Props {
  onChange: (cfgScale: number) => void;
}

const Input = styled(MuiInput)`
  width: 42px;
`;

const CfgScale: React.FC<Props> = (props) => {
  const [cfgScaleValue, setCfgScaleValue] = React.useState(10);

  const handleCfgScaleChange = (event: Event, newValue: number | number[]) => {
    setCfgScaleValue(newValue as number);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCfgScaleValue(
      event.target.value === "" ? 0 : Number(event.target.value)
    );
  };

  const handleCfgScale = () => {
    if (cfgScaleValue < 0) {
      setCfgScaleValue(0);
    } else if (cfgScaleValue > 35) {
      setCfgScaleValue(35);
    }
    props.onChange(cfgScaleValue); // 親コンポーネントに返す値
  };

  return (
    <div>
      <Box sx={{ width: 300 }}>
        <Typography id="input-slider" gutterBottom>
          <b>CfgScale</b>
          <br />
          Use a lower number to increase randomness in the generation.
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Slider
              value={typeof cfgScaleValue === "number" ? cfgScaleValue : 0}
              onChange={handleCfgScaleChange}
              aria-labelledby="input-slider"
              max={35}
            />
          </Grid>
          <Grid item>
            <Input
              value={cfgScaleValue}
              size="small"
              onChange={handleInputChange}
              onBlur={handleCfgScale}
              inputProps={{
                step: 10,
                min: 0,
                max: 35,
                type: "number",
                "aria-labelledby": "input-slider",
              }}
            />
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default CfgScale;
