import ActionLink from "components/editorComponents/Debugger/ActionLink";
import DatasourceLink from "components/editorComponents/Debugger/DataSourceLink";
import WidgetLink from "components/editorComponents/Debugger/WidgetLink";
import JSCollectionLink from "components/editorComponents/Debugger/JSCollectionLink";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";

export const entityTypeLinkMap = {
  [ENTITY_TYPE.WIDGET]: WidgetLink,
  [ENTITY_TYPE.ACTION]: ActionLink,
  [ENTITY_TYPE.DATASOURCE]: DatasourceLink,
  [ENTITY_TYPE.JSACTION]: JSCollectionLink,
};
