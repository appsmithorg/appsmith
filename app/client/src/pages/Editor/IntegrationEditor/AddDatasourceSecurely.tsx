import React from "react";
import styled from "styled-components";
import { Button, Flex, Text } from "@appsmith/ads";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { CalloutCloseClassName } from "@appsmith/ads/src/Callout/Callout.constants";
import { createMessage, DATASOURCE_SECURE_TEXT } from "ee/constants/messages";

const StyledCalloutWrapper = styled(Flex)<{ isClosed: boolean }>`
  ${(props) => (props.isClosed ? "display: none;" : "")}
  background-color: var(--ads-v2-colors-response-info-surface-default-bg);
  padding: var(--ads-spaces-3);
  gap: var(--ads-spaces-3);
  flex-grow: 1;
  align-items: center;
  .ads-v2-text {
    flex-grow: 1;
  }
`;

const SecureImg = styled.img`
  height: 28px;
  padding: var(--ads-v2-spaces-2);
`;

function AddDatasourceSecurely() {
  const [isClosed, setClosed] = React.useState(false);

  return (
    <StyledCalloutWrapper isClosed={isClosed}>
      <SecureImg
        alt={"datasource securely"}
        src={getAssetUrl(`${ASSETS_CDN_URL}/secure-lock.png`)}
      />
      <Text color="var(--ads-v2-color-gray-600)" kind="body-m">
        {createMessage(DATASOURCE_SECURE_TEXT)}
      </Text>
      <Button
        aria-label="Close"
        aria-labelledby="Close"
        className={CalloutCloseClassName}
        isIconButton
        kind="tertiary"
        onClick={() => {
          setClosed(true);
        }}
        size="sm"
        startIcon="close-line"
      />
    </StyledCalloutWrapper>
  );
}

export default AddDatasourceSecurely;
