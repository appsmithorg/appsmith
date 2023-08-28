import React, { useEffect, useState } from "react";
import {
  DemoImage,
  FieldContainer,
  WellContainer,
  WellText,
  WellTitle,
} from "./styles";
import {
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Icon,
  Input,
  Option,
  Select,
  Text,
} from "design-system";
import styled from "styled-components";

const StyledSelect = styled(Select)`
  margin-bottom: 4px;
  background-color: white;
  width: initial;

  .rc-select-selector {
    min-width: 100px;
  }
`;

const CheckboxTextContainer = styled.div`
  display: flex;
  justify-content: flex-start;
`;

interface AddDeployKeyProps {
  onValidate: (isValid: boolean) => void;
  show: boolean;
}

const NOOP = () => {
  // do nothing
};

function AddDeployKey({ onValidate = NOOP, show = true }: AddDeployKeyProps) {
  const [isAgreedAdding, setIsAgreedAdding] = useState<boolean>(false);
  const [sshKeyType, setSshKeyType] = useState<string>("ecdsa256");

  useEffect(() => {
    if (isAgreedAdding) {
      onValidate(true);
    } else {
      onValidate(false);
    }
  }, [isAgreedAdding]);

  return (
    <div style={{ display: show ? "block" : "none" }}>
      <WellContainer>
        <WellTitle>
          <Text kind="heading-s">Add deploy key & give write access</Text>
        </WellTitle>
        <WellText renderAs="p">
          Copy below SSH key and paste it in your repository settings. Now, give
          write access to it.
        </WellText>
        <FieldContainer noPadding>
          <StyledSelect
            onChange={(v) => setSshKeyType(v)}
            size="sm"
            value={sshKeyType}
          >
            <Option value="ecdsa256">ECDSA 256</Option>
            <Option value="rsa4096">RSA 4096</Option>
          </StyledSelect>
          <Input isReadOnly size="md" />
        </FieldContainer>
        <Collapsible isOpen>
          <CollapsibleHeader arrowPosition="end">
            <Icon name="play-circle-line" size="md" />
            <Text>How to paste SSH Key in repo and give write access</Text>
          </CollapsibleHeader>
          <CollapsibleContent>
            <DemoImage
              alt="Copy and paste remote url from Github"
              src="https://placehold.co/600x300"
            />
          </CollapsibleContent>
        </Collapsible>
      </WellContainer>
      <Checkbox isSelected={isAgreedAdding} onChange={setIsAgreedAdding}>
        <CheckboxTextContainer>
          <Text renderAs="p">
            I&apos;ve added deploy key and gave it write access
          </Text>
          <Text color="var(--ads-v2-color-red-600)" renderAs="p">
            &nbsp;*
          </Text>
        </CheckboxTextContainer>
      </Checkbox>
    </div>
  );
}

export default AddDeployKey;
