import { Text } from "@appsmith/ads";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import React, { memo } from "react";
import styled from "styled-components";

const Root = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--ads-v2-spaces-4);
  height: 300px;
`;

export const FunctionCallingEmpty = memo(() => {
  return (
    <Root>
      <img alt="" src={getAssetUrl(`${ASSETS_CDN_URL}/empty-state.svg`)} />
      <Text>Function Calls will be displayed here</Text>
    </Root>
  );
});
