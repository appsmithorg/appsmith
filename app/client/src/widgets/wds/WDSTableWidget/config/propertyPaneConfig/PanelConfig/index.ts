import { updateCustomColumnAliasOnLabelChange } from "../../../widget/propertyUtils";
import Alignment from "./Alignment";
import Basic from "./Basic";
import Color from "./Color";
import Data from "./Data";
import DiscardButtonproperties, {
  discardButtonStyleConfig,
} from "./DiscardButtonproperties";
import Events from "./Events";
import General, { GeneralStyle } from "./General";
import Icon from "./Icon";
import SaveButtonProperties, {
  saveButtonStyleConfig,
} from "./SaveButtonProperties";
import TextFormatting from "./TextFormatting";
import Validations from "./Validation";
import DateProperties from "./DateProperties";

export default {
  editableTitle: true,
  titlePropertyName: "label",
  panelIdPropertyName: "id",
  dependencies: ["primaryColumns", "columnOrder"],
  contentChildren: [
    Data,
    Basic,
    General,
    Validations,
    SaveButtonProperties,
    DiscardButtonproperties,
    Events,
    DateProperties,
  ],
  styleChildren: [
    GeneralStyle,
    Icon,
    Alignment,
    TextFormatting,
    Color,
    saveButtonStyleConfig,
    discardButtonStyleConfig,
  ],
  updateHook: updateCustomColumnAliasOnLabelChange,
};
