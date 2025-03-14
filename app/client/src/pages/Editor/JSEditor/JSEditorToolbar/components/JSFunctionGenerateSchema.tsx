import React from "react";

import { Button } from "@appsmith/ads";
import { testLocators } from "../constants";

interface Props {
  disabled: boolean;
  isLoading: boolean;
  onButtonClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

export const JSFunctionGenerateSchema = (props: Props) => {
  return (
    <Button
      data-testid={testLocators.generateSchemaJSActionTestID}
      isDisabled={props.disabled}
      isLoading={props.isLoading}
      kind="secondary"
      onClick={props.onButtonClick}
      size="sm"
    >
      Save
    </Button>
  );
};
