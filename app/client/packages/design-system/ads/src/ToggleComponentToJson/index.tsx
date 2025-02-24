import React from "react";
import React from "react";
import { Icon } from "../Icon";
import { ToggleMode } from "../../../../../src/components/editorComponents/form/ToggleComponentToJson";

interface ToggleComponentToJsonHandlerProps {
  configProperty: string;
  formName: string;
}

export function ToggleComponentToJsonHandler(
  props: ToggleComponentToJsonHandlerProps,
) {
  return (
    <ToggleMode configProperty={props.configProperty} formName={props.formName}>
      <Icon name="js-toggle" size="md" />
    </ToggleMode>
  );
}
