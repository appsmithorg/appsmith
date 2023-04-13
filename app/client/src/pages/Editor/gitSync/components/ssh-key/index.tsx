import { Colors } from "constants/Colors";
import {
  createMessage,
  SSH_KEY,
  SSH_KEY_GENERATED,
} from "@appsmith/constants/messages";
import React, { useCallback, useState } from "react";
import Key2LineIcon from "remixicon-react/Key2LineIcon";
import { Space } from "pages/Editor/gitSync/components/StyledComponents";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useSSHKeyPair } from "../../hooks";
import {
  DeployedKeyContainer,
  FlexRow,
  KeyText,
  KeyType,
  MoreMenuWrapper,
} from "./StyledComponents";
import { CopySSHKey } from "./CopySSHKey";
import { supportedKeyTypeList } from "./SupportedKeyTypeList";
import getNotificationBanner from "./getNotificationBanner";
import { getConfirmMenuItem } from "./getConfirmMenuItem";
import type { SSHKeyType } from "actions/gitSyncActions";
import {
  Button,
  toast,
  Menu,
  MenuTrigger,
  MenuItem,
  MenuContent,
  Text,
} from "design-system";

type KeysProps = {
  copyToClipboard: () => void;
  deployKeyDocUrl: string;
  showCopied: boolean;
  SSHKeyPair: string;
  isImport?: boolean;
};

const defaultKeyTypes: SSHKeyType[] = [
  {
    keySize: 256,
    platFormSupported: "",
    protocolName: "ECDSA",
  },
  {
    keySize: 4096,
    platFormSupported: "Azure Devops",
    protocolName: "RSA",
  },
];

function Keys(props: KeysProps) {
  const { copyToClipboard, deployKeyDocUrl, showCopied, SSHKeyPair } = props;
  const { generateSSHKey } = useSSHKeyPair();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showKeyGeneratedMessage, setShowKeyGeneratedMessage] = useState(true);
  const [newKeyType, setNewKeyType] = useState("ECDSA");
  const [keyType, keyVal, keyName] = SSHKeyPair.split(" ");
  const exactKeyType = keyType.startsWith("ecdsa") ? "ECDSA" : "RSA";
  const supportedKeys = supportedKeyTypeList(defaultKeyTypes, exactKeyType);
  const keyText = `${keyVal} ${keyName}`;
  const learnMoreClickHandler = () => {
    AnalyticsUtil.logEvent("GS_GIT_DOCUMENTATION_LINK_CLICK", {
      source: "SSH_KEY_ON_GIT_CONNECTION_TAB",
    });
  };
  const regenerateKey = useCallback(() => {
    AnalyticsUtil.logEvent("GS_REGENERATE_SSH_KEY_CONFIRM_CLICK", {
      oldKeyType: keyType,
      newKeyType: newKeyType,
    });
    generateSSHKey(newKeyType);
    setShowConfirmation(false);
    setIsMenuOpen(false);
    setShowKeyGeneratedMessage(true);
    toast.show(createMessage(SSH_KEY_GENERATED), {
      kind: "success",
    });
  }, [newKeyType]);
  return (
    <>
      <Space size={2} />
      <Text color="var(--ads-v2-color-border-brand-secondary)" renderAs="label">
        {createMessage(SSH_KEY)}
      </Text>
      <FlexRow style={{ position: "relative" }}>
        <DeployedKeyContainer $marginTop={1}>
          <FlexRow>
            <Key2LineIcon
              color={Colors.DOVE_GRAY2}
              size={20}
              style={{ marginTop: -3, marginRight: 4 }}
            />
            <KeyType keyType={exactKeyType}>{keyType}</KeyType>
            <KeyText keyType={exactKeyType}>{keyText}</KeyText>
            {CopySSHKey(showCopied, copyToClipboard)}
          </FlexRow>
        </DeployedKeyContainer>
        <MoreMenuWrapper>
          <Menu modal>
            <MenuTrigger>
              <Button
                isIconButton
                kind="tertiary"
                onClick={() => {
                  AnalyticsUtil.logEvent("GS_REGENERATE_SSH_KEY_MORE_CLICK");
                  setShowConfirmation(false);
                }}
                size="md"
                startIcon="more-2-fill"
              />
            </MenuTrigger>
            <MenuContent width="150px">
              {supportedKeys.map((supportedKey) => (
                <MenuItem
                  className={`t--regenerate-sshkey-${supportedKey.protocolName}`}
                  key={`supported-key-${supportedKey.protocolName}-menu-item`}
                  onSelect={() => {
                    setShowConfirmation(true);
                    setNewKeyType(supportedKey.protocolName);
                  }}
                  startIcon={supportedKey.generated ? "check-line" : undefined}
                >
                  {supportedKey.text}
                </MenuItem>
              ))}
              {isMenuOpen &&
                showConfirmation &&
                getConfirmMenuItem(regenerateKey)}
            </MenuContent>
          </Menu>
        </MoreMenuWrapper>
      </FlexRow>
      {showKeyGeneratedMessage &&
        getNotificationBanner(
          deployKeyDocUrl,
          learnMoreClickHandler,
          setShowKeyGeneratedMessage,
        )}
    </>
  );
}

export default Keys;
