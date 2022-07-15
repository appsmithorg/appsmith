import ColumnControl from "./ColumnControl";
import Styles from "./Styles";
import ButtonProperties from "./ButtonProperties";
import MenuItems from "./MenuItems";
import Events from "./Events";
import SaveButtonProperties from "./SaveButtonProperties";
import DiscardButtonproperties from "./DiscardButtonproperties";

export default {
  editableTitle: true,
  titlePropertyName: "label",
  panelIdPropertyName: "id",
  dependencies: ["primaryColumns", "columnOrder"],
  children: [
    ColumnControl,
    ButtonProperties,
    SaveButtonProperties,
    DiscardButtonproperties,
    MenuItems,
    Styles,
    Events,
  ],
};
