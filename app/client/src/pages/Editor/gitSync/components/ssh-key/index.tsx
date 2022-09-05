import { Colors } from "constants/Colors";
import {
  createMessage,
  SSH_KEY,
  SSH_KEY_GENERATED,
} from "@appsmith/constants/messages";
import React, { useCallback, useState } from "react";
import { Icon, IconSize, Menu, Text, TextType } from "design-system";
import Key2LineIcon from "remixicon-react/Key2LineIcon";
import { Space } from "pages/Editor/gitSync/components/StyledComponents";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Position } from "@blueprintjs/core";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { useSSHKeyPair } from "../../hooks";
import {
  DeployedKeyContainer,
  FlexRow,
  KeyText,
  KeyType,
  MoreMenuWrapper,
  MoreOptionsContainer,
  RegenerateOptionsHeader,
} from "./StyledComponents";
import { CopySSHKey } from "./CopySSHKey";
import { supportedKeyTypeList } from "./SupportedKeyTypeList";
import getNotificationBanner from "./getNotificationBanner";
import { getConfirmMenuItem } from "./getConfirmMenuItem";
import { getMenuItems } from "./getMenuItems";
import { SSHKeyType } from "actions/gitSyncActions";

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
    window.open(deployKeyDocUrl, "_blank");
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
    Toaster.show({
      text: createMessage(SSH_KEY_GENERATED),
      variant: Variant.success,
    });
  }, [newKeyType]);
  return (
    <>
      <Space size={7} />
      <Text color={Colors.GREY_9} type={TextType.P1}>
        {createMessage(SSH_KEY)}
      </Text>
      <FlexRow style={{ position: "relative" }}>
        <DeployedKeyContainer $marginTop={4}>
          <FlexRow>
            <Key2LineIcon
              color={Colors.DOVE_GRAY2}
              size={20}
              style={{ marginTop: -1, marginRight: 4 }}
            />
            <KeyType keyType={exactKeyType}>{keyType}</KeyType>
            <KeyText keyType={exactKeyType}>{keyText}</KeyText>
            {CopySSHKey(showCopied, copyToClipboard)}
          </FlexRow>
        </DeployedKeyContainer>
        <MoreMenuWrapper>
          <Menu
            className="more"
            onClosing={() => {
              setIsMenuOpen(false);
              setShowConfirmation(false);
            }}
            onOpening={() => {
              setShowConfirmation(false);
            }}
            position={Position.BOTTOM}
            target={
              <MoreOptionsContainer>
                <Icon
                  fillColor={Colors.DARK_GRAY}
                  hoverFillColor={Colors.GRAY_900}
                  name="more-2-fill"
                  onClick={() => {
                    AnalyticsUtil.logEvent("GS_REGENERATE_SSH_KEY_MORE_CLICK");
                    setShowConfirmation(false);
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  size={IconSize.XXXXL}
                />
              </MoreOptionsContainer>
            }
          >
            {isMenuOpen && !showConfirmation && (
              <>
                <RegenerateOptionsHeader>
                  Regenerate keys
                </RegenerateOptionsHeader>
                {getMenuItems(
                  supportedKeys,
                  setShowConfirmation,
                  setNewKeyType,
                )}
              </>
            )}
            {isMenuOpen &&
              showConfirmation &&
              getConfirmMenuItem(regenerateKey)}
          </Menu>
        </MoreMenuWrapper>
      </FlexRow>
      {showKeyGeneratedMessage &&
        getNotificationBanner(
          learnMoreClickHandler,
          setShowKeyGeneratedMessage,
        )}
    </>
  );
}

export default Keys;
