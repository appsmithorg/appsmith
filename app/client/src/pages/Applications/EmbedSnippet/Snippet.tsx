import React from "react";
import copy from "copy-to-clipboard";
import {
  Toaster,
  Variant,
  Text,
  TextType,
  Icon,
  IconSize,
} from "design-system-old";
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

const EmbedSnippetContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: var(--appsmith-color-black-100);

  .icon {
    flex-shrink: 0;
  }
`;

type EmbedCodeSnippetProps = {
  snippet: string;
  isAppSettings?: boolean;
};

function EmbedCodeSnippet(props: EmbedCodeSnippetProps) {
  const { isAppSettings = false, snippet } = props;
  const scrollWrapperRef = React.createRef<HTMLSpanElement>();
  const onClick = () => {
    copy(props.snippet);
    Toaster.show({
      text: createMessage(IN_APP_EMBED_SETTING.copiedEmbedCode),
      variant: Variant.success,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <Text type={TextType.P1}>
          {createMessage(IN_APP_EMBED_SETTING.embedSnippetTitle)}
        </Text>
        {isAppSettings && (
          <Icon
            className="break-all max-h-32 overflow-y-auto p-0 mr-0.5 icon"
            fillColor={Colors.GRAY_500}
            name="copy-to-clipboard"
            onClick={onClick}
            size={IconSize.XXL}
          />
        )}
      </div>
      <EmbedSnippetContainer data-cy="t--embed-snippet">
        <StyledText
          className="break-all max-h-32 overflow-y-auto p-2 mr-0.5"
          color={Colors.GREY_900}
          ref={scrollWrapperRef}
          type={TextType.P1}
        >
          {snippet}
        </StyledText>
        {!isAppSettings && (
          <Icon
            className="break-all max-h-32 overflow-y-auto p-2 mr-0.5 icon"
            fillColor={Colors.GRAY_500}
            name="copy-to-clipboard"
            onClick={onClick}
            size={IconSize.XXL}
          />
        )}
      </EmbedSnippetContainer>
    </div>
  );
}

export default EmbedCodeSnippet;
