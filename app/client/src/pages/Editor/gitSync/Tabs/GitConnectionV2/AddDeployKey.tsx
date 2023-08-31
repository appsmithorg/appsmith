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
  Option,
  Select,
  Text,
  toast,
} from "design-system";
import styled from "styled-components";
import { CopyButton } from "../../components/CopyButton";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { COPY_SSH_KEY, createMessage } from "@appsmith/constants/messages";
import { useSSHKeyPair } from "../../hooks";

export const DeployedKeyContainer = styled.div`
  height: 36px;
  border: 1px solid var(--ads-v2-color-border);
  padding: 8px;
  box-sizing: border-box;
  border-radius: var(--ads-v2-border-radius);
  background-color: #fff;
  align-items: center;
  display: flex;
`;

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 3px;
`;

export const KeyType = styled.span`
  font-size: 10px;
  text-transform: uppercase;
  color: var(--ads-v2-color-fg);
  font-weight: 700;
`;

export const KeyText = styled.span`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  flex: 1;
  font-size: 10px;
  text-transform: uppercase;
  color: var(--ads-v2-color-fg);
  direction: rtl;
  margin-right: 8px;
`;

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

interface AddDeployKeyState {
  isAddedDeployKey: boolean;
}
interface AddDeployKeyProps {
  onChange: (args: Partial<AddDeployKeyState>) => void;
  value: Partial<AddDeployKeyState>;
}

const NOOP = () => {
  // do nothing
};

function AddDeployKey({ onChange = NOOP, value = {} }: AddDeployKeyProps) {
  const [fetched, setFetched] = useState(false);
  const [sshKeyType, setSshKeyType] = useState<string>();
  const {
    // deployKeyDocUrl,
    fetchingSSHKeyPair,
    fetchSSHKeyPair,
    generateSSHKey,
    generatingSSHKey,
    SSHKeyPair,
  } = useSSHKeyPair();

  useEffect(() => {
    // On mount check SSHKeyPair is defined, if not fetchSSHKeyPair
    if (!fetched) {
      fetchSSHKeyPair({
        onSuccessCallback: () => {
          setFetched(true);
        },
        onErrorCallback: () => {
          setFetched(true);
        },
      });
    }
  }, [fetched]);

  useEffect(() => {
    if (fetched && !fetchingSSHKeyPair) {
      if (SSHKeyPair && SSHKeyPair.includes("rsa")) {
        setSshKeyType("RSA");
      } else {
        setSshKeyType("ECDSA");
      }
    }
  }, [fetched, fetchingSSHKeyPair, SSHKeyPair]);

  useEffect(() => {
    if (
      (sshKeyType && !SSHKeyPair) ||
      (sshKeyType && !SSHKeyPair?.includes(sshKeyType.toLowerCase()))
    ) {
      generateSSHKey(sshKeyType, {
        onSuccessCallback: () => {
          toast.show("SSH Key generated successfully", { kind: "success" });
        },
      });
    }
  }, [sshKeyType, SSHKeyPair]);

  console.log({
    fetched,
    sshKeyType,
    SSHKeyPair,
    fetchingSSHKeyPair,
    generatingSSHKey,
  });

  const loading = fetchingSSHKeyPair || generatingSSHKey;

  return (
    <div>
      <WellContainer>
        <WellTitle>
          <Text kind="heading-s">Add deploy key & give write access</Text>
        </WellTitle>
        <WellText renderAs="p">
          Copy below SSH key and paste it in your repository settings. Now, give
          write access to it.
        </WellText>
        <FieldContainer>
          <StyledSelect
            onChange={(v) => setSshKeyType(v)}
            size="sm"
            value={sshKeyType}
          >
            <Option value="ECDSA">ECDSA 256</Option>
            <Option value="RSA">RSA 4096</Option>
          </StyledSelect>
          {!loading ? (
            <DeployedKeyContainer>
              <Icon
                color="var(--ads-v2-color-fg)"
                name="key-2-line"
                size="md"
                style={{ marginRight: 4 }}
              />
              <KeyType>{sshKeyType}</KeyType>
              <KeyText>{SSHKeyPair}</KeyText>
              <CopyButton
                onCopy={() => {
                  AnalyticsUtil.logEvent("GS_COPY_SSH_KEY_BUTTON_CLICK");
                }}
                tooltipMessage={createMessage(COPY_SSH_KEY)}
                value={SSHKeyPair}
              />
            </DeployedKeyContainer>
          ) : (
            <Text>Loading...</Text>
          )}
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
      <Checkbox
        isSelected={value?.isAddedDeployKey}
        onChange={(v) => onChange({ isAddedDeployKey: v })}
      >
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
