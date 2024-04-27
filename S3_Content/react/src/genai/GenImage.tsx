import React from "react";
import TextareaAutosize from "react-textarea-autosize";
import styled from "styled-components";

const StyledTextarea = styled(TextareaAutosize)`
  width: 100%;
  padding: 10px;
  font-size: 16px;
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

const AutoResizeTextarea: React.FC = () => {
  const [value, setValue] = React.useState("");

  const handleChangeValue = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(evt.target.value);
  };

  return (
    <StyledTextarea
      value={value}
      onChange={handleChangeValue}
      placeholder="Input Prompt..."
    />
  );
};

const GenImage: React.FC = () => {
  return (
    <div>
      <h2>Generate Image</h2>
      <div className="blogContentBackColor">
        <div className="wrap">
          <div className="right">
            <p>test1</p>
          </div>
          <div className="left">
            <p>test2</p>
          </div>
        </div>
        <AutoResizeTextarea />
      </div>
    </div>
  );
};

export default GenImage;
