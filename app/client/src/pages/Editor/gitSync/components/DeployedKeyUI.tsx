import { Colors } from "constants/Colors";
import {
  COPY_SSH_KEY,
  createMessage,
  DELETE_CONFIRMATION_MODAL_TITLE,
  DEPLOY_KEY_USAGE_GUIDE_MESSAGE,
  REGENERATE_KEY_CONFIRM_MESSAGE,
  REGENERATE_SSH_KEY,
  SSH_KEY,
  SSH_KEY_GENERATED,
  YES,
} from "@appsmith/constants/messages";
import React, { useCallback, useState } from "react";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";
import TooltipComponent from "components/ads/Tooltip";
import Key2LineIcon from "remixicon-react/Key2LineIcon";
import { Space } from "pages/Editor/gitSync/components/StyledComponents";
import AnalyticsUtil from "utils/AnalyticsUtil";
import Icon, { IconSize } from "components/ads/Icon";
import Menu from "components/ads/Menu";
import { Position } from "@blueprintjs/core";
import MenuItem from "components/ads/MenuItem";
import Button, { Category, Size } from "components/ads/Button";
import { useSSHKeyPair } from "pages/Editor/gitSync/hooks";
import {
  NotificationBanner,
  NotificationVariant,
} from "components/ads/NotificationBanner";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

const TooltipWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const DeployedKeyContainer = styled.div<{ $marginTop: number }>`
  margin-top: ${(props) => `${props.theme.spaces[props.$marginTop]}px`};
  margin-bottom: 8px;
  height: 35px;
  width: calc(100% - 30px);
  border: 1px solid ${Colors.ALTO_3};
  padding: ${(props) =>
    `${props.theme.spaces[3]}px ${props.theme.spaces[4]}px`};
  box-sizing: border-box;
`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;

const KeyText = styled.span`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: calc(100% - 35px);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${Colors.CODE_GRAY};
`;

const MoreMenuWrapper = styled.div`
  padding: 8px;
  align-items: center;
  position: absolute;
  right: -6px;
  top: 8px;
`;

const MoreOptionsContainer = styled.div`
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ConfirmMenuItem = styled.div`
  padding: 16px 12px;
`;

type DeployedKeyUIProps = {
  copyToClipboard: () => void;
  deployKeyDocUrl: string;
  showCopied: boolean;
  SSHKeyPair: string;
  isImport?: boolean;
};

const NotificationBannerContainer = styled.div`
  max-width: 456px;
`;

function CopySSHKey(showCopied: boolean, copyToClipboard: () => void) {
  return showCopied ? (
    <Icon
      fillColor={Colors.GREEN}
      hoverFillColor={Colors.GREEN}
      name="check-line"
      size={IconSize.XXXL}
    />
  ) : (
    <TooltipWrapper>
      <TooltipComponent content={createMessage(COPY_SSH_KEY)}>
        <Icon
          fillColor={Colors.DARK_GRAY}
          hoverFillColor={Colors.GRAY2}
          name="duplicate"
          onClick={copyToClipboard}
          size={IconSize.XXXL}
        />
      </TooltipComponent>
    </TooltipWrapper>
  );
}

function DeployedKeyUI(props: DeployedKeyUIProps) {
  const { copyToClipboard, deployKeyDocUrl, showCopied, SSHKeyPair } = props;
  const { generateSSHKey } = useSSHKeyPair();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showKeyGeneratedMessage, setShowKeyGeneratedMessage] = useState(true);

  const learnMoreClickHandler = () => {
    AnalyticsUtil.logEvent("GS_GIT_DOCUMENTATION_LINK_CLICK", {
      source: "SSH_KEY_ON_GIT_CONNECTION_TAB",
    });
    window.open(deployKeyDocUrl, "_blank");
  };
  const regenerateKey = useCallback(() => {
    AnalyticsUtil.logEvent("GS_REGENERATE_SSH_KEY_CONFIRM_CLICK");
    generateSSHKey();
    setShowConfirmation(false);
    setIsMenuOpen(false);
    setShowKeyGeneratedMessage(true);
    Toaster.show({
      text: createMessage(SSH_KEY_GENERATED),
      variant: Variant.success,
    });
  }, []);
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
            <KeyText>{SSHKeyPair}</KeyText>
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
              <MenuItem
                cypressSelector="t--regenerate-sshkey"
                onSelect={() => setShowConfirmation(true)}
                text={createMessage(REGENERATE_SSH_KEY)}
              />
            )}
            {isMenuOpen && showConfirmation && (
              <ConfirmMenuItem>
                <Text type={TextType.P3}>
                  {createMessage(REGENERATE_KEY_CONFIRM_MESSAGE)}
                </Text>
                <FlexRow
                  style={{ marginTop: 16.5, justifyContent: "space-between" }}
                >
                  <Text type={TextType.P1}>
                    {createMessage(DELETE_CONFIRMATION_MODAL_TITLE)}
                  </Text>
                  <Button
                    category={Category.primary}
                    onClick={regenerateKey}
                    size={Size.xs}
                    text={createMessage(YES)}
                  />
                </FlexRow>
              </ConfirmMenuItem>
            )}
          </Menu>
        </MoreMenuWrapper>
      </FlexRow>
      {showKeyGeneratedMessage && (
        <NotificationBannerContainer>
          <NotificationBanner
            canClose
            className={"enterprise"}
            learnMoreClickHandler={learnMoreClickHandler}
            onClose={() => setShowKeyGeneratedMessage(false)}
            variant={NotificationVariant.info}
          >
            <div>
              <Text color={Colors.GREY_9} type={TextType.P3}>
                {createMessage(DEPLOY_KEY_USAGE_GUIDE_MESSAGE)}
              </Text>
            </div>
          </NotificationBanner>
        </NotificationBannerContainer>
      )}
    </>
  );
}

export default DeployedKeyUI;
