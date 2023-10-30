import history from "utils/history";
import { datasourcesEditorIdURL } from "@appsmith/RouteBuilder";

export function setSelectedDatasource(id: string | undefined) {
  if (id) {
    history.push(
      datasourcesEditorIdURL({
        datasourceId: id,
      }),
    );
  }
}
