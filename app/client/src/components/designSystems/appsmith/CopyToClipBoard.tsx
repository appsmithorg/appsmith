import React, { createRef, useState } from "react";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { BaseTextInput } from "components/designSystems/appsmith/TextInputComponent";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";

const Wrapper = styled.div`
  display: flex;

  div {
    flex-basis: calc(100% - 90px);
  }
  input:disabled {
    color: #555;
  }
  button {
    flex-basis: 80px;
    margin-left: 10px;
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
      <BaseTextInput
        fill
        disabled={true}
        onChange={() => {
          selectText();
        }}
        defaultValue={copyText}
      />

      <BaseButton
        text={isCopied ? "Copied" : "Copy"}
        onClick={() => {
          copyToClipboard(copyText);
        }}
      />
    </Wrapper>
  );
};

export default CopyToClipboard;
