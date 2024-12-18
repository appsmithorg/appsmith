import React from "react";
import styled from "styled-components";
import { Callout } from "@appsmith/ads";
import type { CalloutProps } from "@appsmith/ads";
import type { GitApiError } from "git/store/types";

const Container = styled.div`
  margin: 8px 0 16px;
`;

export default function DiscardFailedError({
  closeHandler,
  error,
}: {
  closeHandler: () => void;
  error: GitApiError;
}) {
  const calloutOptions: CalloutProps = {
    isClosable: true,
    kind: "error",
    onClose: () => closeHandler(),
    children: error?.message ?? "",
  };

  return (
    <Container data-cy={"discard-error"}>
      <Callout {...calloutOptions} />
    </Container>
  );
}
