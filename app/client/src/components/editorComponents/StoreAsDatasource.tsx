import React from "react";
import styled, { css } from "styled-components";
import {
  setDatsourceEditorMode,
  storeAsDatasource,
} from "actions/datasourceActions";
import { connect, useDispatch, useSelector } from "react-redux";
import history from "utils/history";
import { Classes, FontWeight, Text, TextType } from "design-system";
import { datasourcesEditorIdURL } from "RouteBuilder";
import CloudLine from "remixicon-react/CloudLineIcon";
import Edit2Line from "remixicon-react/Edit2LineIcon";
import { getQueryParams } from "utils/URLUtils";
import { Colors } from "constants/Colors";
import { getCurrentPageId } from "selectors/editorSelectors";
import {
  createMessage,
  EDIT_DATASOURCE,
  SAVE_DATASOURCE,
} from "ce/constants/messages";

export const StoreDatasourceWrapper = styled.div<{ enable?: boolean }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  height: auto;
  min-height: 37px;
  .${Classes.TEXT} {
    color: ${Colors.GRAY_700};
  }
  .${Classes.ICON} {
    margin-right: 5px;
    path {
      fill: ${Colors.GRAY_700};
    }
  }
  ${(props) => (props.enable ? "" : disabled)}
`;

const disabled = css`
  pointer-events: none;
  cursor: not-allowed;
  opacity: 0.7;
`;

type storeDataSourceProps = {
  datasourceId?: string;
  enable: boolean;
  shouldSave: boolean;
  setDatasourceEditorMode: (id: string, viewMode: boolean) => void;
};

interface ReduxDispatchProps {
  setDatasourceEditorMode: (id: string, viewMode: boolean) => void;
}

function StoreAsDatasource(props: storeDataSourceProps) {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId);

  const saveOrEditDatasource = () => {
    if (props.shouldSave) {
      dispatch(storeAsDatasource());
    } else {
      if (props.datasourceId) {
        props.setDatasourceEditorMode(props.datasourceId, false);
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
    <StoreDatasourceWrapper
      className="t--store-as-datasource"
      enable={props.enable}
      onClick={saveOrEditDatasource}
    >
      {props.shouldSave ? (
        <CloudLine className={Classes.ICON} size={14} />
      ) : (
        <Edit2Line className={Classes.ICON} size={14} />
      )}
      <Text type={TextType.P3} weight={FontWeight.BOLD}>
        {props.shouldSave
          ? createMessage(SAVE_DATASOURCE)
          : createMessage(EDIT_DATASOURCE)}
      </Text>
    </StoreDatasourceWrapper>
  );
}

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  setDatasourceEditorMode: (id: string, viewMode: boolean) =>
    dispatch(setDatsourceEditorMode({ id, viewMode })),
});

export default connect(null, mapDispatchToProps)(StoreAsDatasource);
