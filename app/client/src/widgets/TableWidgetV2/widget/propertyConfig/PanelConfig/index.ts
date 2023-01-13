import Events from "./Events";
import Data from "./Data";
import General, { GeneralStyle } from "./General";
import Basic from "./Basic";
import SaveButtonProperties, {
  saveButtonStyleConfig,
} from "./SaveButtonProperties";
import DiscardButtonproperties, {
  discardButtonStyleConfig,
} from "./DiscardButtonproperties";
import Icon from "./Icon";
import TextFormatting from "./TextFormatting";
import Alignment from "./Alignment";
import Color from "./Color";
import BorderAndShadow from "./BorderAndShadow";
import Validations from "./Validation";
import Select from "./Select";
import { updateCustomColumnAliasOnLabelChange } from "../../propertyUtils";

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
    Select,
    Events,
  ],
  styleChildren: [
    GeneralStyle,
    Icon,
    Alignment,
    TextFormatting,
    Color,
    saveButtonStyleConfig,
    discardButtonStyleConfig,
    BorderAndShadow,
  ],
  updateHook: updateCustomColumnAliasOnLabelChange,
};
