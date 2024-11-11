import React from "react";

import { StyledButton } from "../styles";
import { useConnectData } from "./useConnectData";

export function ConnectData({ btnText }: { btnText: string }) {
  const { disabled, isLoading, onClick, show } = useConnectData();

  if (show) {
    return (
      <StyledButton
        data-testid="t--one-click-binding-connect-data"
        isDisabled={disabled}
        isLoading={isLoading}
        onClick={onClick}
        size="md"
      >
        {btnText}
      </StyledButton>
    );
  } else {
    return null;
  }
}
