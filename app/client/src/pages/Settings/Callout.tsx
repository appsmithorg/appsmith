import styled from "styled-components";
import React from "react";
import Icon, { IconSize } from "../../components/ads/Icon";

export type CalloutType = "Warning" | "Info";

export const Wrapper = styled.div<{ type?: CalloutType }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 16px;
  ${(props) =>
    props.type !== "Warning"
      ? `border-left: 5px solid #1d9bd1;
     color: #00407d;
     background: #e8f5fa;`
      : `color: #c91818; background: #FFE9E9;
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
  action?: () => void;
  url?: string;
}) {
  const linkProps: Record<string, string | (() => any)> = {};

  if (props.url) {
    linkProps.href = props.url;
    linkProps.target = "_blank";
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
