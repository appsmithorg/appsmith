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
} from "design-system";
import { isValidGitRemoteUrl } from "../../utils";
import {
  PASTE_SSH_URL_INFO,
  createMessage,
} from "@appsmith/constants/messages";
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
  connectErrorResponse?: any;
}

function GenerateSSH({
  onChange = noop,
  value = {},
  connectErrorResponse,
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
    <div>
      {/* hardcoding messages because server doesn't support feature flag. Will change this later */}
      {connectErrorResponse &&
        connectErrorResponse?.responseMeta?.error?.code === "AE-GIT-4033" && (
          <ErrorCallout kind="error">
            <Text kind="heading-xs" renderAs="h3">
              The repo you added isn&apos;t empty
            </Text>
            <Text renderAs="p">
              Kindly create a new repository and provide its remote SSH URL
              here. We require an empty repository to continue.
            </Text>
          </ErrorCallout>
        )}
      <WellContainer>
        <WellTitleContainer>
          <WellTitle kind="heading-s" renderAs="h3">
            Generate SSH key
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
            Read docs
          </Button>
        </WellTitleContainer>
        <WellText renderAs="p">
          In your empty repo, copy the SSH remote URL & paste it in the input
          field below.
        </WellText>
        <FieldContainer>
          <Input
            data-testid="git-connect-remote-url-input"
            errorMessage={isInvalid ? createMessage(PASTE_SSH_URL_INFO) : ""}
            isRequired
            label="SSH remote URL"
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
              <Text>How to copy & paste SSH remote URL</Text>
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
    </div>
  );
}

export default GenerateSSH;
