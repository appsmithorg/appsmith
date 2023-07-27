import React from "react";
import styled from "styled-components";

const StyledHeaderRightItemContainer = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

const HeaderRightItemContainer = (props: { children: React.ReactNode }) => {
  return (
    <StyledHeaderRightItemContainer>
      {props.children}
    </StyledHeaderRightItemContainer>
  );
};

export default HeaderRightItemContainer;
