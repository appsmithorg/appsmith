import React, { useState } from "react";
import {
  DemoImage,
  ErrorCallout,
  FieldContainer,
  WellContainer,
  WellText,
  WellTitle,
  WellTitleContainer,
} from "./styles";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Icon,
  Input,
  Text,
} from "@appsmith/ads";
import { isValidGitRemoteUrl } from "../../utils";
import {
  COPY_SSH_URL_MESSAGE,
  ERROR_REPO_NOT_EMPTY_MESSAGE,
  ERROR_REPO_NOT_EMPTY_TITLE,
  GENERATE_SSH_KEY_STEP,
  HOW_TO_COPY_REMOTE_URL,
  PASTE_SSH_URL_INFO,
  READ_DOCS,
  REMOTE_URL_INPUT_LABEL,
  createMessage,
} from "ee/constants/messages";
import type { GitProvider } from "./ChooseGitProvider";
import { GIT_DEMO_GIF } from "./constants";
import noop from "lodash/noop";

interface GenerateSSHState {
  gitProvider?: GitProvider;
  remoteUrl: string;
}
interface GenerateSSHProps {
  onChange: (args: Partial<GenerateSSHState>) => void;
  value: Partial<GenerateSSHState>;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorData?: any;
}

function GenerateSSH({
  errorData,
  onChange = noop,
  value = {},
}: GenerateSSHProps) {
  const [isTouched, setIsTouched] = useState(false);
  const isInvalid =
    isTouched &&
    (typeof value?.remoteUrl !== "string" ||
      !isValidGitRemoteUrl(value?.remoteUrl));

  const handleChange = (v: string) => {
    setIsTouched(true);
    onChange({ remoteUrl: v });
  };

  return (
    <>
      {/* hardcoding messages because server doesn't support feature flag. Will change this later */}
      {errorData && errorData?.responseMeta?.error?.code === "AE-GIT-4033" && (
        <ErrorCallout kind="error">
          <Text kind="heading-xs" renderAs="h3">
            {createMessage(ERROR_REPO_NOT_EMPTY_TITLE)}
          </Text>
          <Text renderAs="p">
            {createMessage(ERROR_REPO_NOT_EMPTY_MESSAGE)}
          </Text>
        </ErrorCallout>
      )}
      <WellContainer>
        <WellTitleContainer>
          <WellTitle kind="heading-s" renderAs="h3">
            {createMessage(GENERATE_SSH_KEY_STEP)}
          </WellTitle>
          <Button
            href="https://docs.appsmith.com/advanced-concepts/version-control-with-git/connecting-to-git-repository"
            kind="tertiary"
            renderAs="a"
            size="sm"
            startIcon="book-line"
            target="_blank"
          >
            {" "}
            {createMessage(READ_DOCS)}
          </Button>
        </WellTitleContainer>
        <WellText renderAs="p">{createMessage(COPY_SSH_URL_MESSAGE)}</WellText>
        <FieldContainer>
          <Input
            data-testid="git-connect-remote-url-input"
            errorMessage={isInvalid ? createMessage(PASTE_SSH_URL_INFO) : ""}
            isRequired
            label={createMessage(REMOTE_URL_INPUT_LABEL)}
            onChange={handleChange}
            placeholder="git@example.com:user/repository.git"
            size="md"
            value={value?.remoteUrl}
          />
        </FieldContainer>
        {value?.gitProvider !== "others" && (
          <Collapsible isOpen>
            <CollapsibleHeader arrowPosition="end">
              <Icon name="play-circle-line" size="md" />
              <Text>{createMessage(HOW_TO_COPY_REMOTE_URL)}</Text>
            </CollapsibleHeader>
            <CollapsibleContent>
              <DemoImage
                alt={`Copy and paste remote url from ${value?.gitProvider}`}
                src={
                  GIT_DEMO_GIF.copy_remoteurl[value?.gitProvider || "github"]
                }
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </WellContainer>
    </>
  );
}

export default GenerateSSH;
