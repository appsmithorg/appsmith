import React from "react";
import styled from "styled-components";
import Search from "./Search";

const StyledContainer = styled.div`
  background: white;
`;

const Container = () => {
  return (
    <StyledContainer>
      <Search />
    </StyledContainer>
  );
};

export default Container;
