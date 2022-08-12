import styled from "styled-components";
import React, { useState } from "react";
import { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { Dispatch } from "react";
import { useDispatch } from "react-redux";
import Icon, { IconSize } from "components/ads/Icon";
import { Colors } from "constants/Colors";

export type CalloutType = "Warning" | "Info" | "Notify";

export const Wrapper = styled.div<{ type?: CalloutType }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 16px;
  ${(props) =>
    props.type === "Info"
      ? `border-left: 5px solid ${Colors.CURIOUS_BLUE};
      color: ${Colors.ENTERPRISE_DARK};
      background: ${Colors.PALE_BLUE};`
      : props.type === "Warning"
      ? `color: ${Colors.NOTIFICATION_BANNER_ERROR_TEXT};
        background: ${Colors.FAIR_PINK};`
      : `border-left: 5px solid var(--appsmith-color-black-800);
        color: var(--appsmith-color-black-800);
        background: var(--appsmith-color-black-100);`}
  margin: 16px 0;

  .warning-icon {
    margin-right: 16px;
  }

  .help-icon {
    margin-right: 16px;
    border-radius: 50%;
    border: 2px solid var(--appsmith-color-black-800);
    align-self: baseline;
  }
  .cross-icon {
    align-self: baseline;
  }
  h3 {
    font-weight: 600;
    font-size: 13px;
    line-height: 1.31;
    letter-spacing: -0.24px;
  }

  h4 {
    font-style: normal;
    font-weight: normal;
    font-size: 12px;
    line-height: 16px;
  }
  
  a {
    font-style: normal;
    font-weight: 600;
    font-size: 11px;
    line-height: 13px;
    display: flex;
    align-items: center;
    text-align: center;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    text-decoration: none;
    margin: 5px 0;
    ${(props) =>
      props.type === "Info"
        ? `color: ${Colors.ENTERPRISE_DARK};`
        : props.type === "Warning"
        ? `color: ${Colors.NOTIFICATION_BANNER_ERROR_TEXT};`
        : `color: var(--appsmith-color-black-800);`}
`;

const ContentWrapper = styled.div`
  flex: 1;
`;

export function Callout(props: {
  desc: string;
  type: CalloutType;
  title?: string;
  actionLabel?: string;
  action?: (
    dispatch: Dispatch<ReduxAction<any>>,
    settings?: Record<string, any>,
  ) => void;
  url?: string;
  showCrossIcon?: boolean;
}) {
  const dispatch = useDispatch();
  const linkProps: Record<string, string | (() => any)> = {};
  const [show, setShow] = useState(true);

  if (props.url) {
    linkProps.href = props.url;
    linkProps.target = "_blank";
  } else if (props.action) {
    linkProps.onClick = () => {
      if (props.action) {
        props.action(dispatch);
      }
    };
  }

  const handleClick = () => {
    setShow(false);
  };

  return show ? (
    <Wrapper type={props.type}>
      {props.type === "Warning" && (
        <Icon
          className="warning-icon"
          name="warning-line"
          size={IconSize.XXXXL}
        />
      )}
      {props.type === "Notify" && (
        <Icon className="help-icon" name="help" size={IconSize.LARGE} />
      )}
      <ContentWrapper>
        {props.title && <h3>{props.title}</h3>}
        <h4>{props.desc}</h4>
        {props.actionLabel && (
          <a {...linkProps}>
            {props.actionLabel}&nbsp;&nbsp;
            <Icon name="right-arrow" size={IconSize.LARGE} />
          </a>
        )}
      </ContentWrapper>
      {props.showCrossIcon && (
        <Icon
          className="cross-icon"
          name="cross"
          onClick={handleClick}
          size={IconSize.SMALL}
        />
      )}
    </Wrapper>
  ) : null;
}
