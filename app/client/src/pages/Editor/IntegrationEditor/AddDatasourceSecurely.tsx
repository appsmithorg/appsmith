import React from "react";
import styled from "styled-components";
import SecureLock from "assets/images/secure-lock.svg";
import { Flex, Text } from "design-system";

const Wrapper = styled(Flex)`
  background: var(--ads-v2-color-blue-100);
  border-radius: var(--ads-v2-border-radius);
  padding: var(--ads-v2-spaces-7);
  align-items: center;
`;

function AddDatasourceSecurely() {
  return (
    <Wrapper>
      <img alt="Secure & fast connection" src={SecureLock} />
      <Flex flexDirection="column" ml="spaces-4">
        <Text color="var(--ads-v2-color-gray-700)" kind="heading-m">
          Secure & fast connection
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
