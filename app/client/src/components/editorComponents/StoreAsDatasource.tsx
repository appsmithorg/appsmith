import React from "react";
import styled, { css } from "styled-components";
import {
  setDatasourceViewMode,
  storeAsDatasource,
} from "actions/datasourceActions";
import { connect, useDispatch, useSelector } from "react-redux";
import history from "utils/history";
import { Classes, FontWeight, Text, TextType } from "design-system-old";
import { datasourcesEditorIdURL } from "RouteBuilder";
import { getQueryParams } from "utils/URLUtils";
import { Colors } from "constants/Colors";
import { getCurrentPageId } from "selectors/editorSelectors";
import {
  createMessage,
  EDIT_DATASOURCE,
  SAVE_DATASOURCE,
} from "@appsmith/constants/messages";
import { importRemixIcon } from "design-system-old";

const CloudLine = importRemixIcon(
  () => import("remixicon-react/CloudLineIcon"),
);
const Edit2Line = importRemixIcon(
  () => import("remixicon-react/Edit2LineIcon"),
);

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
  setDatasourceViewMode: (viewMode: boolean) =>
    dispatch(setDatasourceViewMode(viewMode)),
});

export default connect(null, mapDispatchToProps)(StoreAsDatasource);
