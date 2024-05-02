import React from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";

interface Props {
  onChange: (size: number) => void;
}

const Size: React.FC<Props> = (props) => {
  const [size, setSize] = React.useState(512);

  const handleSize = (event: SelectChangeEvent<number>) => {
    const newSize = event.target.value as number;
    setSize(newSize);
    props.onChange(newSize);
  };

  return (
    <div>
      <FormControl fullWidth>
        <InputLabel id="size-label">Size</InputLabel>
        <Select
          labelId="size-label"
          id="size-select"
          value={size}
          label="size"
          onChange={handleSize}
        >
          <MenuItem value={512}>512x512</MenuItem>
          <MenuItem value={1024}>1024x1024</MenuItem>
        </Select>
      </FormControl>
      <br />
      <br />
    </div>
  );
};

export default Size;
