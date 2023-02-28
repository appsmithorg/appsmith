import React from "react";
import copy from "copy-to-clipboard";
import { Text, TextType } from "design-system-old";
import { Colors } from "constants/Colors";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import styled from "styled-components";
import { toast } from "design-system";

const StyledText = styled(Text)`
  line-height: 1.5;

  /* width */
  ::-webkit-scrollbar {
    width: 3px;
  }
  /* Track */
  ::-webkit-scrollbar-track {
    background: ${Colors.GRAY_100};
  }
`;

type EmbedCodeSnippetProps = {
  snippet: string;
};

function EmbedCodeSnippet(props: EmbedCodeSnippetProps) {
  const scrollWrapperRef = React.createRef<HTMLSpanElement>();
  const onClick = () => {
    copy(props.snippet);
    toast.show(createMessage(IN_APP_EMBED_SETTING.copiedEmbedCode), {
      kind: "success",
    });
  };

  return (
    <div
      className="flex flex-1 select-all bg-[color:var(--appsmith-color-black-100)]"
      data-cy="t--embed-snippet"
      onClick={onClick}
    >
      <StyledText
        className="break-all max-h-32 overflow-y-auto p-2 mr-0.5"
        color={Colors.GREY_900}
        ref={scrollWrapperRef}
        type={TextType.P1}
      >
        {props.snippet}
      </StyledText>
    </div>
  );
}

export default EmbedCodeSnippet;
