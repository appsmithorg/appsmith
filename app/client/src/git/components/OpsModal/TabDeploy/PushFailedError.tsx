import { Callout } from "@appsmith/ads";
import { Text, TextType } from "@appsmith/ads-old";
import type { GitApiError } from "git/store/types";
import React from "react";
import styled from "styled-components";

const Container = styled.div`
  margin: 8px 0 16px;
`;

export interface PushFailedErrorProps {
  closeHandler: () => void;
  error: GitApiError;
}

export default function PushFailedError({
  closeHandler,
  error,
}: PushFailedErrorProps) {
  return (
    <Container className="t--git-push-failed-error">
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
