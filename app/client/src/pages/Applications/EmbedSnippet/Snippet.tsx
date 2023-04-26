import React from "react";
import copy from "copy-to-clipboard";
import { Text } from "design-system";
import { Colors } from "constants/Colors";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import styled from "styled-components";
import { toast, Icon } from "design-system";

// const Container = styled.div`
//   background-color: var(--ads-v2-color-bg-subtle);
//   border-radius: var(--ads-v2-border-radius);
// `;

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

  const onClick = () => {
    copy(props.snippet);
    toast.show(createMessage(IN_APP_EMBED_SETTING.copiedEmbedCode), {
      kind: "success",
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <Text>{createMessage(IN_APP_EMBED_SETTING.embedSnippetTitle)}</Text>
        {isAppSettings && (
          <Icon
            className="break-all max-h-32 overflow-y-auto p-0 mr-0.5 icon"
            name="copy-control"
            onClick={onClick}
            size="lg"
          />
        )}
      </div>
      <EmbedSnippetContainer data-cy="t--embed-snippet">
        <StyledText
          className="break-all max-h-32 overflow-y-auto p-2 mr-0.5"
          color={Colors.GREY_900}
        >
          {snippet}
        </StyledText>
        {!isAppSettings && (
          <Icon
            className="break-all max-h-32 overflow-y-auto p-2 mr-0.5 icon"
            name="copy-control"
            onClick={onClick}
            size="lg"
          />
        )}
      </EmbedSnippetContainer>
    </div>
  );
}

export default EmbedCodeSnippet;
