import { Callout } from "@appsmith/ads";
import { Text, TextType } from "@appsmith/ads-old";
import React from "react";
import styled from "styled-components";

const Container = styled.div`
  margin: 8px 0 16px;
`;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PushFailedWarning({ closeHandler, error }: any) {
  return (
    <Container>
      <Callout isClosable kind="error" onClose={closeHandler}>
        <>
          <Text type={TextType.H5}>{error.errorType}</Text>
          <br />
          <Text type={TextType.P3}>{error.message}</Text>
        </>
      </Callout>
    </Container>
  );
}
