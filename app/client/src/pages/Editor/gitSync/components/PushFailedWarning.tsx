import { Callout } from "design-system";
import { Text, TextType } from "design-system-old";
import React from "react";
import styled from "styled-components";

const Container = styled.div`
  margin: 8px 0 16px;
`;

export default function PushFailedWarning({ closeHandler, error }: any) {
  return (
    <Container className="ankita">
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
