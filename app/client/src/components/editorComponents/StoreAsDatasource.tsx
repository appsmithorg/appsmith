import React from "react";
import {
  setDatasourceViewMode,
  storeAsDatasource,
} from "actions/datasourceActions";
import { connect, useDispatch, useSelector } from "react-redux";
import history from "utils/history";
import { datasourcesEditorIdURL } from "@appsmith/RouteBuilder";
import { getQueryParams } from "utils/URLUtils";
import { getCurrentPageId } from "selectors/editorSelectors";
import {
  createMessage,
  EDIT_DATASOURCE,
  SAVE_DATASOURCE,
} from "@appsmith/constants/messages";
import { Button } from "design-system";

interface storeDataSourceProps {
  datasourceId?: string;
  enable: boolean;
  shouldSave: boolean;
  setDatasourceViewMode: (payload: {
    datasourceId: string;
    viewMode: boolean;
  }) => void;
}

interface ReduxDispatchProps {
  setDatasourceViewMode: (payload: {
    datasourceId: string;
    viewMode: boolean;
  }) => void;
}

function StoreAsDatasource(props: storeDataSourceProps) {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId);

  const saveOrEditDatasource = () => {
    if (props.shouldSave) {
      dispatch(storeAsDatasource());
    } else {
      if (props.datasourceId) {
        props.setDatasourceViewMode({
          datasourceId: props.datasourceId,
          viewMode: false,
        });
        history.push(
          datasourcesEditorIdURL({
            pageId,
            datasourceId: props.datasourceId,
            params: getQueryParams(),
          }),
        );
      }
    }
  };

  return (
    <Button
      className="t--store-as-datasource"
      isDisabled={!props.enable}
      kind="secondary"
      onClick={saveOrEditDatasource}
      size="md"
      startIcon={props.shouldSave ? "cloud" : "pencil-line"}
    >
      {props.shouldSave
        ? createMessage(SAVE_DATASOURCE)
        : createMessage(EDIT_DATASOURCE)}
    </Button>
  );
}

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  setDatasourceViewMode: (payload: {
    datasourceId: string;
    viewMode: boolean;
  }) =>
    dispatch(
      setDatasourceViewMode({
        datasourceId: payload.datasourceId,
        viewMode: payload.viewMode,
      }),
    ),
});

export default connect(null, mapDispatchToProps)(StoreAsDatasource);
