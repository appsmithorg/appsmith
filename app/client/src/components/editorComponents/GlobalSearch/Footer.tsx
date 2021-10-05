import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  span {
    color: ${(props) => props.theme.colors.globalSearch.searchItemText};
    font-variant: all-small-caps;
    font-size: ${(props) => props.theme.fontSizes[2]}px;
    margin-right: ${(props) => props.theme.spaces[1]}px;
    font-weight: bold;
  }
  div {
    margin-right: ${(props) => props.theme.spaces[7]}px;
    font-size: ${(props) => props.theme.fontSizes[2]}px;
    text-align: center;
  }
  color: ${(props) => props.theme.colors.globalSearch.searchItemText};
  background: white;
  padding: ${(props) => props.theme.spaces[3]}px
    ${(props) => props.theme.spaces[6]}px;
  display: flex;
  flex-direction: row;
`;

const FOOTER_INFO = [
  {
    action: "\u2191\u2193",
    description: "Select",
  },
  {
    action: "ENTER",
    description: "Open",
  },
];

function Footer() {
  return (
    <Wrapper>
      {FOOTER_INFO.map((info) => {
        return (
          <div key={info.action}>
            <span>{info.action}</span>
            {info.description}
          </div>
        );
      })}
    </Wrapper>
  );
}

export default Footer;
