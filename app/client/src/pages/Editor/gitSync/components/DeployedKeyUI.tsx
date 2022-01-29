import { Colors } from "constants/Colors";
import {
  createMessage,
  DELETE_CONFIRMATION_MODAL_TITLE,
  DEPLOY_KEY_USAGE_GUIDE_MESSAGE,
  LEARN_MORE,
  REGENERATE_KEY_CONFIRM_MESSAGE,
  REGENERATE_SSH_KEY,
  YES,
} from "constants/messages";
import React, { useCallback, useState } from "react";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";
import TooltipComponent from "components/ads/Tooltip";
import Key2LineIcon from "remixicon-react/Key2LineIcon";
import { Space } from "./StyledComponents";
import AnalyticsUtil from "utils/AnalyticsUtil";
import Icon, { IconSize } from "components/ads/Icon";
import Menu from "components/ads/Menu";
import { Position } from "@blueprintjs/core";
import MenuItem from "components/ads/MenuItem";
import Button, { Category, Size } from "components/ads/Button";
import { useSSHKeyPair } from "../hooks";

const TooltipWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

// const Icon = styled.span<{
//   size: string;
//   color: string;
//   marginOffset?: number;
//   hoverColor: string;
// }>`
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   margin-top: ${(props) => `${props.theme.spaces[1]}px`};
//   padding: ${(props) => `${props.theme.spaces[props.marginOffset || 0]}px`};
//   cursor: pointer;
//   svg {
//     width: ${(props) => props.size};
//     height: ${(props) => props.size};
//     path {
//       fill: ${(props) => props.color};
//     }
//   }
//   &:hover {
//     svg {
//       path {
//         fill: ${(props) => props.hoverColor};
//       }
//     }
//   }
// `;

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

const LintText = styled.a`
  :hover {
    color: ${Colors.CRUSTA};
  }
  color: ${Colors.CRUSTA};
  cursor: pointer;
  font-weight: 500;
  margin-left: ${(props) => props.theme.spaces[1]}px;
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

function DeployedKeyUI(props: DeployedKeyUIProps) {
  const { copyToClipboard, deployKeyDocUrl, showCopied, SSHKeyPair } = props;
  const { generateSSHKey } = useSSHKeyPair();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirm, setIsConfirm] = useState(false);
  const clickHandler = () => {
    AnalyticsUtil.logEvent("GS_GIT_DOCUMENTATION_LINK_CLICK", {
      source: "SSH_KEY_ON_GIT_CONNECTION_TAB",
    });
    window.open(deployKeyDocUrl, "_blank");
  };
  const regenerateKey = useCallback(() => {
    AnalyticsUtil.logEvent("GS_REGENERATE_SSH_KEY_CONFIRM_CLICK");
    generateSSHKey();
    setIsConfirm(false);
    setIsMenuOpen(false);
  }, []);
  return (
    <>
      <Space size={7} />
      <Text color={Colors.GREY_9} type={TextType.P3}>
        {createMessage(DEPLOY_KEY_USAGE_GUIDE_MESSAGE)}
        <LintText onClick={clickHandler}>{createMessage(LEARN_MORE)}</LintText>
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
            {showCopied ? (
              <Icon
                fillColor={Colors.GREEN}
                hoverFillColor={Colors.GREEN}
                name="check-line"
                size={IconSize.XXXL}
              />
            ) : (
              <TooltipWrapper>
                <TooltipComponent content="Copy Key">
                  <Icon
                    fillColor={Colors.DARK_GRAY}
                    hoverFillColor={Colors.GRAY2}
                    name="duplicate"
                    onClick={copyToClipboard}
                    size={IconSize.XXXL}
                  />
                </TooltipComponent>
              </TooltipWrapper>
            )}
          </FlexRow>
        </DeployedKeyContainer>
        <MoreMenuWrapper>
          <Menu
            className="more"
            onClosing={() => {
              setIsMenuOpen(false);
              setIsConfirm(false);
            }}
            onOpening={() => {
              setIsConfirm(false);
            }}
            position={Position.RIGHT_TOP}
            target={
              <MoreOptionsContainer>
                <Icon
                  fillColor={Colors.DARK_GRAY}
                  hoverFillColor={Colors.GRAY_900}
                  name="more-2-fill"
                  onClick={() => {
                    AnalyticsUtil.logEvent("GS_REGENERATE_SSH_KEY_MORE_CLICK");
                    setIsConfirm(false);
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  size={IconSize.XXXXL}
                />
              </MoreOptionsContainer>
            }
          >
            {isMenuOpen && !isConfirm && (
              <MenuItem
                cypressSelector="t--regenerate-sshkey"
                onSelect={() => setIsConfirm(true)}
                text={createMessage(REGENERATE_SSH_KEY)}
              />
            )}
            {isMenuOpen && isConfirm && (
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
    </>
  );
}

export default DeployedKeyUI;
