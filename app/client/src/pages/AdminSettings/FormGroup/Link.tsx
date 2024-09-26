import { Icon } from "@blueprintjs/core";
import { Text } from "@appsmith/ads";
import { createMessage, LEARN_MORE } from "ee/constants/messages";
import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import type { SettingComponentProps } from "./Common";

const LinkWrapper = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[16]}px;
  margin-top: 3px;
  background: var(--ads-v2-color-bg);
  padding: ${(props) => props.theme.spaces[3]}px
    ${(props) => props.theme.spaces[7]}px;
  display: inline-block;
`;

const StyledLink = styled.a`
  cursor: pointer;
  text-transform: uppercase;
  &&,
  &:hover {
    color: var(--ads-v2-color-fg-emphasis);
    text-decoration: none;
  }
`;

const StyledIcon = styled(Icon)`
  && {
    color: var(--ads-v2-color-fg);
    transform: translate(2px, -1px);

    svg:hover path {
      fill: var(--ads-v2-color-fg-emphasis);
      cursor: pointer;
    }
  }
`;

export default function Link({ setting }: SettingComponentProps) {
  const dispatch = useDispatch();
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        <Text
          color="var(--ads-v2-color-fg)"
          data-testid="admin-settings-link-label"
          renderAs="span"
        >
          {setting.label || ""}
        </Text>
        &nbsp;
        <Text renderAs="p">
          {createMessage(LEARN_MORE)}{" "}
          <StyledIcon icon="arrow-right" iconSize={11} />
        </Text>
      </StyledLink>
    </LinkWrapper>
  );
}
