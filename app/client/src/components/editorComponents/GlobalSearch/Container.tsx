import React from "react";
import styled from "styled-components";
import Search from "./Search";

const StyledContainer = styled.div`
  height: 30vh;
  width: 100%;
  max-width: 600px;
`;

const Container = () => {
  return (
    <StyledContainer>
      <Search />
    </StyledContainer>
  );
};

export default Container;
