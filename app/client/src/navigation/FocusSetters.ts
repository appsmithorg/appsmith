import history from "utils/history";
import {
  datasourcesEditorIdURL,
  queryEditorIdURL,
} from "@appsmith/RouteBuilder";

export function setSelectedDatasource(id: string | undefined) {
  if (id) {
    history.push(
      datasourcesEditorIdURL({
        datasourceId: id,
      }),
    );
  }
}

export function setSelectedQuery(id: string | undefined) {
  if (id) {
    history.push(
      queryEditorIdURL({
        queryId: id,
      }),
    );
  }
}
