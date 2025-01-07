import React from "react";
import styled from "styled-components";
import { Flex, Text } from "@appsmith/ads";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { CalloutCloseClassName } from "@appsmith/ads/src/Callout/Callout.constants";
import { createMessage, DATASOURCE_SECURE_TEXT } from "ee/constants/messages";
import {
  StyledCallout,
  StyledCloseButton,
} from "@appsmith/ads/src/Callout/Callout.styles";

const SecureImg = styled.img`
  height: 28px;
  padding: var(--ads-v2-spaces-2);
`;

function AddDatasourceSecurely() {
  const [isClosed, setClosed] = React.useState(false);

  return (
    <StyledCallout isClosed={isClosed} kind="info">
      <Flex alignItems="center" flexGrow="1" gap="spaces-3">
        <SecureImg
          alt={"datasource securely"}
          src={getAssetUrl(`${ASSETS_CDN_URL}/secure-lock.png`)}
        />
        <Text color="var(--ads-v2-color-gray-600)" kind="body-m">
          {createMessage(DATASOURCE_SECURE_TEXT)}
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
      </Flex>
    </StyledCallout>
  );
}

export default AddDatasourceSecurely;
