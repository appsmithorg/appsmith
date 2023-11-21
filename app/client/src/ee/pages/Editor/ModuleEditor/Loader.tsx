import React from "react";
import styled from "styled-components";

import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { Spinner } from "design-system";

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

function Loader() {
  return (
    <LoadingContainer data-testid="t--loader-module">
      <Spinner size={30} />
    </LoadingContainer>
  );
}

export default Loader;
