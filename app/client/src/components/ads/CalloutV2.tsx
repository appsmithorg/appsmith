import styled from "styled-components";
import React from "react";
import { ReduxAction } from "constants/ReduxActionConstants";
import { Dispatch } from "react";
import { useDispatch } from "react-redux";
import Icon, { IconSize } from "../../components/ads/Icon";
import { Colors } from "constants/Colors";

export type CalloutType = "Warning" | "Info";

export const Wrapper = styled.div<{ type?: CalloutType }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 16px;
  ${(props) =>
    props.type !== "Warning"
      ? `border-left: 5px solid ${Colors.CURIOUS_BLUE};
     color: #00407d;
     background: ${Colors.PALE_BLUE};`
      : `color: #c91818; background: ${Colors.FAIR_PINK};
   `}
  margin: 16px 0;

  .warning-icon {
    margin-right: 16px;
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
      props.type !== "Warning" ? `color: #00407d;` : `color: #c91818;`}
`;

export function Callout(props: {
  type: CalloutType;
  title: string;
  actionLabel?: string;
  action?: (
    dispatch: Dispatch<ReduxAction<any>>,
    settings?: Record<string, any>,
  ) => void;
  url?: string;
}) {
  const dispatch = useDispatch();
  const linkProps: Record<string, string | (() => any)> = {};

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

  return (
    <Wrapper type={props.type}>
      {props.type === "Warning" && (
        <Icon
          className="warning-icon"
          name="warning-line"
          size={IconSize.XXXXL}
        />
      )}
      <div>
        <h4>{props.title}</h4>
        <a {...linkProps}>
          {props.actionLabel}&nbsp;&nbsp;
          <Icon name="right-arrow" size={IconSize.LARGE} />
        </a>
      </div>
    </Wrapper>
  );
}
