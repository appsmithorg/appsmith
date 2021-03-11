import React from "react";
import styled from "styled-components";

const LetterIconWrapper = styled.div`
  height: 28px;
  width: 28px;
  border-radius: ${(props) => props.theme.radii[1]}px;
  background: ${(props) => props.theme.colors.navBG};
  font-size: ${(props) => props.theme.fontSizes[5]}px;
  font-weight: ${(props) => props.theme.fontWeights[3]};
  display: flex;
  justify-content: center;
  align-items: center;
`;

function LetterIcon(props: { text: string }) {
  return <LetterIconWrapper>{props.text.toUpperCase()}</LetterIconWrapper>;
}

export default LetterIcon;
