import React from "react";
import styled from "styled-components";

const Flag = styled.span`
  padding: 2px 5px;
  border: 1px solid #716e6e;
  color: #716e6e;
  text-transform: uppercase;
  font-size: 10px;
  font-weight: 600;
`;

function FlagBadge(props: { name: string }) {
  return <Flag>{props.name}</Flag>;
}

export default FlagBadge;
