import React from "react";
import styled from "styled-components";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import MuiInput from "@mui/material/Input";

interface Props {
  onChange: (steps: number) => void;
}

const Input = styled(MuiInput)`
  width: 42px;
`;

const StepsSlider: React.FC<Props> = (props) => {
  const [stepsValue, setStepsValue] = React.useState(100);

  const handleStepsChange = (event: Event, newValue: number | number[]) => {
    setStepsValue(newValue as number);
    props.onChange(stepsValue); // 親コンポーネントに返す値
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStepsValue(event.target.value === "" ? 0 : Number(event.target.value));
    props.onChange(stepsValue); // 親コンポーネントに返す値
  };

  const handleSteps = () => {
    if (stepsValue < 0) {
      setStepsValue(0);
    } else if (stepsValue > 150) {
      setStepsValue(150);
    }
    props.onChange(stepsValue); // 親コンポーネントに返す値
  };

  return (
    <div>
      <Box sx={{ width: 300 }}>
        <Typography id="input-slider" gutterBottom>
          <b>steps</b>
          <br />
          More steps can result in a more accurate result.
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Slider
              value={typeof stepsValue === "number" ? stepsValue : 0}
              onChange={handleStepsChange}
              aria-labelledby="input-slider"
              max={150}
            />
          </Grid>
          <Grid item>
            <Input
              value={stepsValue}
              size="small"
              onChange={handleInputChange}
              onBlur={handleSteps}
              inputProps={{
                step: 10,
                min: 0,
                max: 150,
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

export default StepsSlider;
