import { Flex, Text } from "@appsmith/ads";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import React from "react";
import styled from "styled-components";

const Wrapper = styled(Flex)`
  overflow: auto;
`;

const TextContainer = styled(Flex)`
  max-width: 640px;
`;

const ImageWrapper = styled.img`
  width: 150px;
`;

const UlWrapper = styled.ul`
  list-style: disc;
  margin-left: var(--ads-v2-spaces-5);
`;

export default function ExternalSaasConnection() {
  return (
    <Wrapper
      flexDirection="column"
      flexGrow="1"
      gap="spaces-7"
      padding="spaces-8"
    >
      <ImageWrapper src={getAssetUrl(`${ASSETS_CDN_URL}/Illustration.png`)} />
      <TextContainer flexDirection="column" flexGrow="1" gap="spaces-3">
        <Text isBold kind="heading-m">
          Connect Your Data Source
        </Text>
        <Flex flexDirection="column" flexGrow="1" gap="spaces-6">
          <Text>
            This connection requires a slightly different setup process to
            ensure seamless functionality for advanced use cases. Here’s what
            you can expect:
          </Text>
          <UlWrapper>
            <li>
              <Text isBold>Simplified Flow:</Text> Just enter your credentials
              in the modal that appears.
            </li>
            <li>
              <Text isBold>Secure Authentication:</Text> You’ll authenticate
              directly with the service to enable the integration.
            </li>
            <li>
              <Text isBold>Ready to Use:</Text> Once configured, you’ll be able
              to start using this integration immediately.
            </li>
          </UlWrapper>
          <Text>Click below to begin the setup.</Text>
        </Flex>
      </TextContainer>
    </Wrapper>
  );
}
