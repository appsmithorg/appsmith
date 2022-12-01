import React from "react";
import styled from "constants/DefaultTheme";
import SpinnerLoader from "pages/common/SpinnerLoader";
import { Text, TextType } from "design-system";

const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: ${(props) => `${props.theme.spaces[3]}px`};
`;

function StatusLoader({ loaderMsg }: { loaderMsg: string }) {
  return (
    <LoaderWrapper>
      <SpinnerLoader height="50px" width="50px" />
      <Text style={{ marginLeft: 8 }} type={TextType.P3}>
        {loaderMsg}
      </Text>
    </LoaderWrapper>
  );
}

export default StatusLoader;
