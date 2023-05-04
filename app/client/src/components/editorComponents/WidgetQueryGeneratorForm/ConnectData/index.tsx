import React from "react";

import { StyledButton } from "../styles";
import { useConnectData } from "./useConnectData";

export function ConnectData() {
  const { disabled, isLoading, onClick, show } = useConnectData();

  if (show) {
    return (
      <StyledButton
        isDisabled={disabled}
        isLoading={isLoading}
        onClick={onClick}
      >
        CONNECT DATA
      </StyledButton>
    );
  } else {
    return null;
  }
}
