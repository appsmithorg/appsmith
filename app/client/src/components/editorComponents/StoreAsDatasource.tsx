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
import { getCurrentPageId } from "selectors/editorSelectors";
import {
  createMessage,
  EDIT_DATASOURCE,
  SAVE_DATASOURCE,
} from "@appsmith/constants/messages";
import { Icon } from "design-system";

export const StoreDatasourceWrapper = styled.div<{ enable?: boolean }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  height: auto;
  min-height: 37px;
  .${Classes.TEXT} {
    color: var(--ads-v2-color-fg);
  }
  svg {
    margin-right: 5px;
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
      <Icon name={props.shouldSave ? "cloud-line" : "edit-2-line"} size="md" />
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
