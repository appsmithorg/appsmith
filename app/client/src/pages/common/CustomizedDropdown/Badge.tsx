import React from "react";
import styled from "styled-components";
const BadgeWrapper = styled.div`
  &&&&& {
    display: flex;
    flex-directition: row;
    justify-content: flex-start;
    img {
      flex-basis: 0 1 auto;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      margin-right: 16px;
    }
    div {
      flex-basis: 1 0 auto;
      flex-direction: column;
      justify-content: space-around;
      align-self: center;
      & h3,
      h5 {
        font-weight: ${(props) => props.theme.fontWeights[1]};
        margin: 0;
      }
      & h5 {
        color: ${(props) => props.theme.colors.paneText};
        font-size: ${(props) => props.theme.fontSizes[3]}px;
      }
    }
  }
`;

type BadgeProps = {
  imageURL?: string;
  text: string;
  subtext?: string;
};

export function Badge(props: BadgeProps) {
  return (
    <BadgeWrapper>
      <img alt={props.text} src={props.imageURL} />
      <div>
        <h3>{props.text}</h3>
        {props.subtext && <h5>{props.subtext}</h5>}
      </div>
    </BadgeWrapper>
  );
}

export default Badge;
