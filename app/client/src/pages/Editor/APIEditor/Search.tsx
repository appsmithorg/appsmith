import React from "react";

import { BaseTextInput } from "components/designSystems/appsmith/TextInputComponent";
import { Colors } from "constants/Colors";
import styled from "styled-components";

const Container = styled.div`
  .heading {
    font-size: 16px;
    line-height: 32px;
    font-weight: 500;
  }
`;
const SearchBar = styled(BaseTextInput)`
  margin-bottom: 10px;
  input {
    background-color: ${Colors.WHITE};
    1px solid ${Colors.GEYSER};
  }
`;

class Search extends React.Component {
  render() {
    return (
      <Container>
        <SearchBar icon="search" placeholder="Search" />
        <p className="heading">Providers</p>
      </Container>
    );
  }
}

export default Search;
