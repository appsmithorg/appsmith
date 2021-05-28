import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  span {
    color: rgba(255, 255, 255, 1);
    font-variant: all-small-caps;
    font-size: 13.2px;
    margin-right: 4px;
  }
  div {
    margin-right: 16px;
    font-size: 12px;
    text-align: center;
  }
  color: ${(props) => props.theme.colors.globalSearch.searchItemText};
  padding: 5px 14px;
  display: flex;
  flex-direction: row;
`;

const FOOTER_INFO = [
  {
    action: "↑↓",
    description: "SELECT",
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
