import { Colors } from "constants/Colors";
import {
  createMessage,
  DEPLOY_KEY_USAGE_GUIDE_MESSAGE,
  LEARN_MORE,
} from "constants/messages";
import React from "react";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";
import TooltipComponent from "components/ads/Tooltip";
import { ReactComponent as CopySvg } from "assets/icons/ads/file-copy-line.svg";
import { ReactComponent as TickSvg } from "assets/images/tick.svg";
import Key2LineIcon from "remixicon-react/Key2LineIcon";
import { Space } from "./StyledComponents";
import AnalyticsUtil from "utils/AnalyticsUtil";

const TooltipWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Icon = styled.span<{
  size: string;
  color: string;
  marginOffset?: number;
  hoverColor: string;
}>`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: ${(props) => `${props.theme.spaces[1]}px`};
  padding: ${(props) => `${props.theme.spaces[props.marginOffset || 0]}px`};
  cursor: pointer;
  svg {
    width: ${(props) => props.size};
    height: ${(props) => props.size};
    path {
      fill: ${(props) => props.color};
    }
  }
  &:hover {
    svg {
      path {
        fill: ${(props) => props.hoverColor};
      }
    }
  }
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
  width: 100%;
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

type DeployedKeyUIProps = {
  copyToClipboard: () => void;
  deployKeyDocUrl: string;
  showCopied: boolean;
  SSHKeyPair: string;
};

function DeployedKeyUI(props: DeployedKeyUIProps) {
  const { copyToClipboard, deployKeyDocUrl, showCopied, SSHKeyPair } = props;
  const clickHandler = () => {
    AnalyticsUtil.logEvent("GS_GIT_DOCUMENTATION_LINK_CLICK", {
      source: "SSH_KEY_ON_GIT_CONNECTION_TAB",
    });
    window.open(deployKeyDocUrl, "_blank");
  };
  return (
    <>
      <Space size={7} />
      <Text color={Colors.GREY_9} type={TextType.P3}>
        {createMessage(DEPLOY_KEY_USAGE_GUIDE_MESSAGE)}
        <LintText onClick={clickHandler}>{createMessage(LEARN_MORE)}</LintText>
      </Text>
      <FlexRow>
        <DeployedKeyContainer $marginTop={4}>
          <FlexRow>
            <Key2LineIcon
              color={Colors.DOVE_GRAY2}
              size={20}
              style={{ marginTop: -1, marginRight: 4 }}
            />
            <KeyText>{SSHKeyPair}</KeyText>
          </FlexRow>
        </DeployedKeyContainer>
        {showCopied ? (
          <Icon
            color={Colors.GREEN}
            hoverColor={Colors.GREEN}
            marginOffset={4}
            size="16px"
          >
            <TickSvg />
          </Icon>
        ) : (
          <TooltipWrapper>
            <TooltipComponent content="Copy Key">
              <Icon
                color={Colors.DARK_GRAY}
                hoverColor={Colors.GRAY2}
                marginOffset={3}
                onClick={copyToClipboard}
                size="22px"
              >
                <CopySvg />
              </Icon>
            </TooltipComponent>
          </TooltipWrapper>
        )}
      </FlexRow>
    </>
  );
}

export default DeployedKeyUI;
