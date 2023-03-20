import { Icon } from "@blueprintjs/core";
import { Text, TextType } from "design-system-old";
import { Colors } from "constants/Colors";
import { createMessage, LEARN_MORE } from "@appsmith/constants/messages";
import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import type { SettingComponentProps } from "./Common";

const LinkWrapper = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[16]}px;
  margin-top: 3px;
  background: ${(props) => props.theme.settings.linkBg};
  padding: ${(props) => props.theme.spaces[3]}px
    ${(props) => props.theme.spaces[7]}px;
  display: inline-block;
`;

const StyledLink = styled.a`
  cursor: pointer;
  text-transform: uppercase;
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
  color: ${Colors.MIRAGE};
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
        setting.action(dispatch);
      }
    };
  }
  return (
    <LinkWrapper
      className={`${setting.isHidden ? "hide" : ""} t--read-more-link`}
      data-testid="admin-settings-link"
    >
      <StyledLink data-testid="admin-settings-link-anchor" {...linkProps}>
        <LinkLabel data-testid="admin-settings-link-label">
          {createMessage(() => setting.label || "")}
        </LinkLabel>
        &nbsp;
        <StyledText type={TextType.P1}>{createMessage(LEARN_MORE)}</StyledText>
        &nbsp;
        <StyledIcon icon="arrow-right" iconSize={11} />
      </StyledLink>
    </LinkWrapper>
  );
}
