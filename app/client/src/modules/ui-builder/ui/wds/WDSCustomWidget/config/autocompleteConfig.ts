import type { ExtraDef } from "utils/autocomplete/defCreatorUtils";
import { generateTypeDef } from "utils/autocomplete/defCreatorUtils";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";

import type { CustomWidgetProps } from "../types";

export const autocompleteConfig = (
  widget: CustomWidgetProps,
  extraDefsToDefine?: ExtraDef,
) => ({
  isVisible: DefaultAutocompleteDefinitions.isVisible,
  model: generateTypeDef(widget.model, extraDefsToDefine),
});
