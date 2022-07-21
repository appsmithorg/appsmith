import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";
import React from "react";
import styled from "styled-components";

const StyledTag = styled.div`
  height: 16px;
  width: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  ${(props) => getTypographyByKey(props, "btnSmall")};
  border: 1px solid ${Colors.COD_GRAY};
  color: ${Colors.COD_GRAY};
`;

function BetaTag() {
  return <StyledTag data-testid="t--beta-tag">BETA</StyledTag>;
}

export default BetaTag;
