import { Icon } from "@blueprintjs/core";
import Text, { TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";
import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { SettingComponentProps } from "./Common";

const LinkWrapper = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[16]}px;
  margin-top: 3px;
  background: ${(props) => props.theme.settings.linkBg};
  padding: 8px 16px;
  display: inline-block;
`;

const StyledLink = styled.a`
  &&,
  &:hover {
    color: ${(props) => props.theme.colors.settings.link};
    text-decoration: none;
  }
`;

const StyledText = styled(Text)`
  font-weight: 600;
  font-size: 11px;
`;

const StyledIcon = styled(Icon)`
  && {
    color: ${(props) => props.theme.colors.settings.link};
    transform: translate(2px, -1px);

    svg:hover path {
      fill: ${(props) => props.theme.colors.settings.link};
      cursor: pointer;
    }
  }
`;

const LinkLabel = styled.span`
  color: ${Colors.BODY_COLOR};
`;

export default function Link({ setting }: SettingComponentProps) {
  const dispatch = useDispatch();
  const linkProps: Record<string, string | (() => any)> = {};
  if (setting.url) {
    linkProps.href = setting.url;
    linkProps.target = "_blank";
  } else if (setting.action) {
    linkProps.onClick = () => {
      if (setting.action) {
        dispatch(setting.action());
      }
    };
  }
  return (
    <LinkWrapper className={setting.isHidden ? "hide" : ""}>
      <StyledLink {...linkProps}>
        <LinkLabel>{setting.label}</LinkLabel>
        &nbsp;
        <StyledText type={TextType.P1}>READ MORE</StyledText>
        &nbsp;
        <StyledIcon icon="arrow-right" iconSize={11} />
      </StyledLink>
    </LinkWrapper>
  );
}
