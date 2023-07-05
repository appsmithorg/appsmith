import React from "react";
import {
  setDatasourceViewMode,
  storeAsDatasource,
} from "actions/datasourceActions";
import { connect, useDispatch, useSelector } from "react-redux";
import history from "utils/history";
import { datasourcesEditorIdURL } from "RouteBuilder";
import { getQueryParams } from "utils/URLUtils";
import { getCurrentPageId } from "selectors/editorSelectors";
import {
  createMessage,
  EDIT_DATASOURCE,
  SAVE_DATASOURCE,
} from "@appsmith/constants/messages";
import { Button } from "design-system";

type storeDataSourceProps = {
  datasourceId?: string;
  enable: boolean;
  shouldSave: boolean;
  setDatasourceViewMode: (viewMode: boolean) => void;
};

interface ReduxDispatchProps {
  setDatasourceViewMode: (viewMode: boolean) => void;
}

function StoreAsDatasource(props: storeDataSourceProps) {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId);

  const saveOrEditDatasource = () => {
    if (props.shouldSave) {
      dispatch(storeAsDatasource());
    } else {
      if (props.datasourceId) {
        props.setDatasourceViewMode(false);
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
  setDatasourceViewMode: (viewMode: boolean) =>
    dispatch(setDatasourceViewMode(viewMode)),
});

export default connect(null, mapDispatchToProps)(StoreAsDatasource);
