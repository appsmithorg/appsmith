import { Callout } from "@appsmith/ads";
import { Text, TextType } from "@appsmith/ads-old";
import type { GitApiError } from "git/store/types";
import React from "react";
import styled from "styled-components";

const Container = styled.div`
  margin: 8px 0 16px;
`;

export interface PushFailedWarningProps {
  closeHandler: () => void;
  error: GitApiError;
}

export default function PushFailedWarning({
  closeHandler,
  error,
}: PushFailedWarningProps) {
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
