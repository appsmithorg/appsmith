import React from "react";
import copy from "copy-to-clipboard";
import { Toaster, Variant, Text, TextType } from "design-system";
import { Colors } from "constants/Colors";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import styled from "styled-components";

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
    Toaster.show({
      text: createMessage(IN_APP_EMBED_SETTING.copiedEmbedCode),
      variant: Variant.success,
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
