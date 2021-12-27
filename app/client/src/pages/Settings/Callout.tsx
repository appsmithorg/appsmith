import styled from "styled-components";
import React from "react";

export type CalloutType = "Warning" | "Info";

export const Wrapper = styled.div<{ type?: CalloutType }>`
  //height: 56px;
  width: 100%;
  padding: 8px 16px;
  ${(props) =>
    props.type !== "Warning"
      ? `border-left: 5px solid #1d9bd1;
     color: #00407d;
     background: #e8f5fa;`
      : `color: #D71010; background: #FFE9E9;
   `}
  margin: 16px 0;
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
      props.type !== "Warning" ? `color: #00407d;` : `color: #D71010;`}
`;

export function Callout(props: {
  type: CalloutType;
  title: string;
  learnAction?: () => void;
}) {
  return (
    <Wrapper>
      <h4>{props.title}</h4>
      <a>Learn More</a>
    </Wrapper>
  );
}
