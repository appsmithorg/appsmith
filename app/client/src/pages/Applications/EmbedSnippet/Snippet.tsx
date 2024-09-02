import React from "react";
import copy from "copy-to-clipboard";
import { createMessage, IN_APP_EMBED_SETTING } from "ee/constants/messages";
import styled from "styled-components";
import { Icon, Text, toast } from "@appsmith/ads";

const StyledText = styled(Text)``;

const EmbedSnippetContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background-color: var(--ads-v2-color-bg-subtle);
  border-radius: var(--ads-v2-border-radius);
  padding: 0.5rem;
  gap: 1.5rem;
`;

interface EmbedCodeSnippetProps {
  snippet: string;
  isAppSettings?: boolean;
}

interface SnippetProps {
  onCopy: () => void;
  snippet: string;
}

function AppSettings(props: SnippetProps) {
  return (
    <>
      <div className="flex justify-between">
        <Text>{createMessage(IN_APP_EMBED_SETTING.embedSnippetTitle)}</Text>
        <Icon
          className="cursor-pointer"
          name="duplicate"
          onClick={props.onCopy}
          size="md"
        />
      </div>
      <EmbedSnippetContainer data-testid="t--embed-snippet">
        <StyledText
          className="break-all max-h-32 overflow-y-auto"
          kind="action-m"
        >
          {props.snippet}
        </StyledText>
      </EmbedSnippetContainer>
    </>
  );
}

function ShareModal(props: SnippetProps) {
  return (
    <>
      <Text>{createMessage(IN_APP_EMBED_SETTING.embedSnippetTitle)}</Text>
      <EmbedSnippetContainer data-testid="t--embed-snippet">
        <StyledText
          className="break-all max-h-32 overflow-y-auto"
          kind="action-m"
        >
          {props.snippet}
        </StyledText>
        <Icon
          className="cursor-pointer"
          name="duplicate"
          onClick={props.onCopy}
          size="md"
        />
      </EmbedSnippetContainer>
    </>
  );
}

function EmbedCodeSnippet(props: EmbedCodeSnippetProps) {
  const onCopy = () => {
    copy(props.snippet);
    toast.show(createMessage(IN_APP_EMBED_SETTING.copiedEmbedCode), {
      kind: "success",
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {props.isAppSettings ? (
        <AppSettings onCopy={onCopy} snippet={props.snippet} />
      ) : (
        <ShareModal onCopy={onCopy} snippet={props.snippet} />
      )}
    </div>
  );
}

export default EmbedCodeSnippet;
