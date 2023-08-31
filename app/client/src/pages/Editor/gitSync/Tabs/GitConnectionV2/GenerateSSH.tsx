import React, { useState } from "react";
import {
  DemoImage,
  FieldContainer,
  WellContainer,
  WellText,
  WellTitle,
} from "./styles";
import {
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
import GitUserSettings from "../GitSettings/GitUserSettings";

interface GenerateSSHState {
  remoteUrl: string;
}
interface GenerateSSHProps {
  onChange: (args: Partial<GenerateSSHState>) => void;
  value: Partial<GenerateSSHState>;
}

const NOOP = () => {
  // do nothing
};

function GenerateSSH({ onChange = NOOP, value = {} }: GenerateSSHProps) {
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
      <WellContainer>
        <WellTitle>
          <Text kind="heading-s">Generate SSH key</Text>
        </WellTitle>
        <WellText renderAs="p">
          In your empty repo, copy the SSH remote URL & paste it in the input
          field below.
        </WellText>
        <FieldContainer>
          <Input
            errorMessage={isInvalid ? createMessage(PASTE_SSH_URL_INFO) : ""}
            isRequired
            label="SSH remote URL"
            onChange={handleChange}
            placeholder="git@example.com:user/repository.git"
            size="md"
            value={value?.remoteUrl}
          />
        </FieldContainer>
        <GitUserSettings />
        <Collapsible isOpen>
          <CollapsibleHeader arrowPosition="end">
            <Icon name="play-circle-line" size="md" />
            <Text>How to copy & paste SSH remote URL</Text>
          </CollapsibleHeader>
          <CollapsibleContent>
            <DemoImage
              alt="Copy and paste remote url from Github"
              src="https://placehold.co/600x300"
            />
          </CollapsibleContent>
        </Collapsible>
      </WellContainer>
    </div>
  );
}

export default GenerateSSH;
