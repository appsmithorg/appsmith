import { Icon } from "@blueprintjs/core";
import { Text } from "design-system";
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
    color: var(--ads-v2-color-black-550);
    text-decoration: none;
  }
`;

const StyledIcon = styled(Icon)`
  && {
    color: var(--ads-v2-color-black-550);
    transform: translate(2px, -1px);

    svg:hover path {
      fill: var(--ads-v2-color-black-550);
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
        <Text renderAs="p">
          {createMessage(LEARN_MORE)}{" "}
          <StyledIcon icon="arrow-right" iconSize={11} />
        </Text>
      </StyledLink>
    </LinkWrapper>
  );
}
