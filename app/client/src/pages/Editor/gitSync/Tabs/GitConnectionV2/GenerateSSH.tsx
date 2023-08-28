import React, { useEffect, useState } from "react";
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

interface GenerateSSHProps {
  onValidate: (isValid: boolean) => void;
  show: boolean;
}

const NOOP = () => {
  // do nothing
};

function GenerateSSH({ onValidate = NOOP, show = true }: GenerateSSHProps) {
  const [sshUrl, setSshUrl] = useState<string>();
  useEffect(() => {
    if (!!sshUrl) {
      onValidate(true);
    } else {
      onValidate(false);
    }
  }, [sshUrl]);

  return (
    <div style={{ display: show ? "block" : "none" }}>
      <WellContainer>
        <WellTitle>
          <Text kind="heading-s">Generate SSH key</Text>
        </WellTitle>
        <WellText renderAs="p">
          In your empty repo, copy the SSH remote URL & paste it in the input
          field below.
        </WellText>
        <FieldContainer noPadding>
          <Input
            isRequired
            label="SSH remote URL"
            onChange={(v) => setSshUrl(v)}
            placeholder="git@example.com:user/repository.git"
            size="md"
            value={sshUrl}
          />
        </FieldContainer>
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
