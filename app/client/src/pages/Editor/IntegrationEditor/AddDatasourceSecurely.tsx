import React from "react";
import styled from "styled-components";
import { Text } from "@appsmith/ads";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import {
  StyledCallout,
  StyledCloseButton,
} from "@appsmith/ads/src/Callout/Callout.styles";
import { CalloutCloseClassName } from "@appsmith/ads/src/Callout/Callout.constants";

const Wrapper = styled(StyledCallout)<{ isClosed: boolean }>`
  align-items: center;
  img {
    height: 28px;
    padding: var(--ads-v2-spaces-2);
  }
`;

function AddDatasourceSecurely() {
  const [isClosed, setClosed] = React.useState(false);

  return (
    <Wrapper isClosed={isClosed} kind="info">
      <img
        alt={"datasource securely"}
        src={getAssetUrl(`${ASSETS_CDN_URL}/secure-lock.png`)}
      />
      <Text color="var(--ads-v2-color-gray-600)" kind="body-m">
        When connecting datasources, your passwords are AES-256 encrypted and we
        never store any of your data.
      </Text>
      <StyledCloseButton
        aria-label="Close"
        className={CalloutCloseClassName}
        isIconButton
        kind="tertiary"
        onClick={() => {
          setClosed(true);
        }}
        size="sm"
        startIcon="close-line"
      />
    </Wrapper>
  );
}

export default AddDatasourceSecurely;
