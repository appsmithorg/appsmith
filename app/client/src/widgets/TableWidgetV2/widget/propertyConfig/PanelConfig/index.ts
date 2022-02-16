import ColumnControl from "./ColumnControl";
import Styles from "./Styles";
import ButtonProperties from "./ButtonProperties";
import MenuItems from "./MenuItems";

export default {
  editableTitle: true,
  titlePropertyName: "label",
  panelIdPropertyName: "id",
  dependencies: ["primaryColumns", "columnOrder"],
  children: [ColumnControl, Styles, ButtonProperties, MenuItems],
};
