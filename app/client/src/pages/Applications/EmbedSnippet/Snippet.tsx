import React from "react";
import copy from "copy-to-clipboard";
import { Input } from "design-system";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import styled from "styled-components";
import { toast } from "design-system";

const StyledInput = styled(Input)`
  > .ads-v2-input__input-section > div {
    opacity: 1;
  }
  textarea {
    font-size: var(--ads-v2-font-size-4);
    height: 150px;
  }
`;

type EmbedCodeSnippetProps = {
  snippet: string;
};

function EmbedCodeSnippet(props: EmbedCodeSnippetProps) {
  const scrollWrapperRef = React.createRef<HTMLInputElement>();
  const onClick = () => {
    copy(props.snippet);
    toast.show(createMessage(IN_APP_EMBED_SETTING.copiedEmbedCode), {
      kind: "success",
    });
  };

  return (
    <div data-cy="t--embed-snippet" onClick={onClick}>
      <StyledInput
        isReadOnly
        ref={scrollWrapperRef}
        renderAs="textarea"
        size="md"
        value={props.snippet}
      />
    </div>
  );
}

export default EmbedCodeSnippet;
