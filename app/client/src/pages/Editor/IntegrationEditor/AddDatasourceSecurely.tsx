import React from "react";
import styled from "styled-components";
import { Flex, Text } from "@appsmith/ads";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import {
  createMessage,
  DATASOURCE_SECURELY_TITLE,
} from "ee/constants/messages";

const Wrapper = styled(Flex)`
  background: var(--ads-v2-color-blue-100);
  border-radius: var(--ads-v2-border-radius);
  padding: var(--ads-v2-spaces-7);
  align-items: center;
`;

function AddDatasourceSecurely() {
  return (
    <Wrapper>
      <img
        alt={createMessage(DATASOURCE_SECURELY_TITLE)}
        src={getAssetUrl(`${ASSETS_CDN_URL}/secure-lock.svg`)}
      />
      <Flex flexDirection="column" ml="spaces-4">
        <Text color="var(--ads-v2-color-gray-700)" kind="heading-m">
          {createMessage(DATASOURCE_SECURELY_TITLE)}
        </Text>
        <Text color="var(--ads-v2-color-gray-600)" kind="body-m">
          Connect a datasource to start building workflows. Your passwords are{" "}
          <u>AES-256 encrypted</u> and we never store any of your data.
        </Text>
      </Flex>
    </Wrapper>
  );
}

export default AddDatasourceSecurely;
