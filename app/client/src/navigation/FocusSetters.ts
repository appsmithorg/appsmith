import history from "utils/history";
import {
  apiEditorIdURL,
  datasourcesEditorIdURL,
  jsCollectionIdURL,
  queryEditorIdURL,
} from "@appsmith/RouteBuilder";

export function setSelectedDatasource(id: string | undefined) {
  if (id) {
    history.replace(
      datasourcesEditorIdURL({
        datasourceId: id,
      }),
    );
  }
}

export function setPageUrl(path: string | undefined) {
  if (path) {
    const params = history.location.search;
    history.replace(`${path}${params}`);
  }
}

export function setAppUrl(path: string | undefined) {
  if (path) {
    const params = history.location.search;
    history.replace(`${path}${params}`);
  }
}

export function setSelectedQuery(
  state: { type: "QUERY" | "API"; id: string } | undefined,
) {
  if (state) {
    if (state.type === "QUERY") {
      history.replace(
        queryEditorIdURL({
          queryId: state.id,
        }),
      );
    } else {
      history.replace(
        apiEditorIdURL({
          apiId: state.id,
        }),
      );
    }
  }
}

export function setSelectedJSObject(id: string | undefined) {
  if (id) {
    history.replace(
      jsCollectionIdURL({
        collectionId: id,
      }),
    );
  }
}
