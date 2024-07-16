import styled from "styled-components";
import React, { useState } from "react";
import Icon, { IconSize } from "../Icon";

export type CalloutType = "Warning" | "Info" | "Notify";

export const Wrapper = styled.div<{ type?: CalloutType }>`
display: flex;
align-items: center;
width: 100%;
padding: 8px 16px;
  // TODO: Why doesn't warning have a left border?
${(props) =>
  props.type === "Info"
    ? `border-left: 5px solid var(--ads-old-color-curious-blue);
color: var(--ads-old-color-enterprise-dark);
background: var(--ads-old-color-pale-blue);`
    : props.type === "Warning"
      ? `color: var(--ads-notification-banner-error-text-color);
background: var(--ads-old-color-fair-pink);`
      : `border-left: 5px solid var(--ads-color-black-800);
color: var(--ads-color-black-800);
background: var(--ads-color-black-100);`}
margin: 16px 0;

.warning-icon {
margin-right: 16px;
}

.help-icon {
margin-right: 16px;
border-radius: 50%;
border: 2px solid var(--ads-color-black-800);
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
    ? `color: var(--ads-old-color-enterprise-dark);`
    : props.type === "Warning"
      ? `color: var(--ads-notification-banner-error-text-color);`
      : `color: var(--ads-color-black-800);`}
`;

const ContentWrapper = styled.div`
  flex: 1;
`;

function CalloutV2(props: {
  actionLabel?: string;
  desc: string;
  onClick?: React.MouseEvent<HTMLElement>;
  showCrossIcon?: boolean;
  title?: string;
  type: CalloutType;
  url?: string;
}) {
  const linkProps: Record<string, string | any> = {};
  const [show, setShow] = useState(true);
  const { onClick } = props;

  if (props.url) {
    linkProps.href = props.url;
    linkProps.target = "_blank";
  } else if (onClick) {
    linkProps.onClick = onClick;
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

export default CalloutV2;
