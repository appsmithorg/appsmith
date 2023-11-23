import history from "utils/history";
import {
  datasourcesEditorIdURL,
  jsCollectionIdURL,
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

export function setPageUrl(path: string | undefined) {
  if (path) {
    const params = history.location.search;
    history.push(`${path}${params}`);
  }
}

export function setAppUrl(path: string | undefined) {
  if (path) {
    const params = history.location.search;
    history.push(`${path}${params}`);
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

export function setSelectedJSObject(id: string | undefined) {
  if (id) {
    history.push(
      jsCollectionIdURL({
        collectionId: id,
      }),
    );
  }
}
