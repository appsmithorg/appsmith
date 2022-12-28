import { updateCustomColumnAliasOnLabelChange } from "../../propertyUtils";
import Alignment from "./Alignment";
import Basic from "./Basic";
import BorderAndShadow from "./BorderAndShadow";
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
import Select from "./Select";
import TextFormatting from "./TextFormatting";
import Validations from "./Validation";

export default {
  editableTitle: true,
  titlePropertyName: "label",
  panelIdPropertyName: "id",
  dependencies: ["primaryColumns", "columnOrder"],
  contentChildren: [
    Data,
    Basic,
    General,
    // ...(ResponsiveBehaviorConfig as any),
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
