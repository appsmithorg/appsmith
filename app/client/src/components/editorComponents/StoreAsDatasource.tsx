import React from "react";
import {
  setDatasourceViewMode,
  storeAsDatasource,
} from "actions/datasourceActions";
import { connect, useDispatch, useSelector } from "react-redux";
import history from "utils/history";
import { datasourcesEditorIdURL } from "ee/RouteBuilder";
import { getQueryParams } from "utils/URLUtils";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import {
  createMessage,
  EDIT_DATASOURCE,
  SAVE_DATASOURCE,
} from "ee/constants/messages";
import { Button } from "@appsmith/ads";

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
  const basePageId = useSelector(getCurrentBasePageId);

  // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
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
            basePageId,
            datasourceId: props.datasourceId,
            params: getQueryParams(),
            generateEditorPath: true,
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
      startIcon={props.shouldSave ? "database-2-line" : "pencil-line"}
    >
      {props.shouldSave
        ? createMessage(SAVE_DATASOURCE)
        : createMessage(EDIT_DATASOURCE)}
    </Button>
  );
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
