import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import {
  InlineEditingSaveOptions,
  TableWidgetProps,
} from "widgets/TableWidgetV2/constants";
import {
  totalRecordsCountValidation,
  uniqueColumnNameValidation,
  updateColumnOrderHook,
  updateInlineEditingSaveOptionHook,
  updateInlineEditingOptionDropdownVisibilityHook,
} from "../propertyUtils";
import {
  createMessage,
  TABLE_WIDGET_TOTAL_RECORD_TOOLTIP,
} from "@appsmith/constants/messages";
import panelConfig from "./PanelConfig";
import { composePropertyUpdateHook } from "widgets/WidgetUtils";
