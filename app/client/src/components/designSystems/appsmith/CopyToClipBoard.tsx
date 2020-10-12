import React, { createRef, useState } from "react";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import TextInput from "components/ads/TextInput";
import Button, { Category, Size } from "components/ads/Button";

const Wrapper = styled.div`
  display: flex;

  div {
    flex-basis: calc(100% - 110px);
  }
  a {
    flex-basis: 110px;
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
      <TextInput
        fill
        ref={copyURLInput}
        readOnly
        onChange={() => {
          selectText();
        }}
        defaultValue={copyText}
      />

      <Button
        text={isCopied ? "Copied" : "Copy"}
        category={Category.tertiary}
        onClick={() => {
          copyToClipboard(copyText);
        }}
        size={Size.large}
      />
    </Wrapper>
  );
};

export default CopyToClipboard;
