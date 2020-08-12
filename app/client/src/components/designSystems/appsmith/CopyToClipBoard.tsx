import React, { createRef, useState } from "react";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
`;
const StyledInput = styled.input`
  flex: 1;
  border: 1px solid #d3dee3;
  border-right: none;
  padding: 6px 12px;
  font-size: 14px;
  color: #768896;
  border-radius: 4px 0 0 4px;
  width: 90%;
  overflow: hidden;
`;

const SelectButton = styled(BaseButton)`
  &&&& {
    max-width: 70px;
    margin: 0 0px;
    min-height: 32px;
    border-radius: 0px 4px 4px 0px;
    font-weight: bold;
    background-color: #f6f7f8;
    font-size: 14px;
    &.bp3-button {
      padding: 0px 0px;
    }
  }
`;

const CopyToClipboard = (props: any) => {
  const { copyText } = props;
  const copyURLInput = createRef<HTMLInputElement>();
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (url: string) => {
    copy(url);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  const selectText = () => {
    if (copyURLInput.current) {
      copyURLInput.current.setSelectionRange(0, copyText.length);
    }
  };
  return (
    <Wrapper>
      <StyledInput
        type="text"
        ref={copyURLInput}
        readOnly
        onClick={() => {
          selectText();
        }}
        value={copyText}
      />
      <SelectButton
        text={isCopied ? "Copied" : "Copy"}
        accent="secondary"
        onClick={() => {
          copyToClipboard(copyText);
        }}
      />
    </Wrapper>
  );
};

export default CopyToClipboard;
