import React from "react";
import styled from "styled-components";
import { Callout } from "@appsmith/ads";
import type { CalloutProps } from "@appsmith/ads";

const Container = styled.div`
  margin: 8px 0 16px;
`;

export default function DiscardFailedWarning({
  closeHandler,
  error,
}: {
  closeHandler: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
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
