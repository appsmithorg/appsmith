import React from "react";

import { StyledButton } from "../styles";
import { useConnectData } from "./useConnectData";

export function ConnectData() {
  const { disabled, onClick, show } = useConnectData();

  if (show) {
    return (
      <StyledButton
        disabled={disabled}
        onClick={onClick}
        tag="button"
        text="Connect data"
      />
    );
  } else {
    return null;
  }
}
