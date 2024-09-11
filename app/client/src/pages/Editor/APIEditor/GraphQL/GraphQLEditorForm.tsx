import React, { useCallback, useContext, useRef } from "react";
import { connect } from "react-redux";
import type { InjectedFormProps } from "redux-form";
import { change, formValueSelector, reduxForm } from "redux-form";
import classNames from "classnames";
import styled from "styled-components";
import { API_EDITOR_FORM_NAME } from "ee/constants/forms";
import type { Action } from "entities/Action";
import type { AppState } from "ee/reducers";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import useHorizontalResize from "utils/hooks/useHorizontalResize";
import get from "lodash/get";
import type { Datasource } from "entities/Datasource";
import {
  getActionByBaseId,
  getActionData,
} from "ee/selectors/entitiesSelector";
import { isEmpty } from "lodash";
import type { CommonFormProps } from "../CommonEditorForm";
import CommonEditorForm from "../CommonEditorForm";
import QueryEditor from "./QueryEditor";
import { tailwindLayers } from "constants/Layers";
import VariableEditor from "./VariableEditor";
import Pagination from "./Pagination";
import { ApiEditorContext } from "../ApiEditorContext";
import { actionResponseDisplayDataFormats } from "pages/Editor/utils";

const ResizeableDiv = styled.div`
  display: flex;
  height: 100%;
  flex-shrink: 0;
`;

const BodyWrapper = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
  &&&& .CodeMirror {
    height: 100%;
    border-top: 1px solid var(--ads-v2-color-border);
    border-bottom: 1px solid var(--ads-v2-color-border);
    border-radius: 0;
    padding: 0;
  }
  & .CodeMirror-scroll {
    margin: 0px;
    padding: 0px;
    overflow: auto !important;
  }
`;

const ResizerHandler = styled.div<{ resizing: boolean }>`
  width: 6px;
  height: 100%;
  margin-left: 2px;
  border-right: 1px solid var(--ads-v2-color-border);
  background: ${(props) =>
    props.resizing ? "var(--ads-v2-color-border)" : "transparent"};
  &:hover {
    background: var(--ads-v2-color-border);
    border-color: transparent;
  }
`;

type APIFormProps = {
  httpMethodFromForm: string;
  actionConfigurationBody: string;
} & CommonFormProps;

type Props = APIFormProps & InjectedFormProps<Action, APIFormProps>;

const DEFAULT_GRAPHQL_VARIABLE_WIDTH = 300;

/**
 * Graphql Editor form which uses the Common Editor and pass on the differentiating components from the API Editor.
 * @param props using type Props
 * @returns Graphql Editor Area which is used to editor APIs using GraphQL datasource.
 */
function GraphQLEditorForm(props: Props) {
  const { actionName } = props;
  const theme = EditorTheme.LIGHT;
  const sizeableRef = useRef<HTMLDivElement>(null);
  const [variableEditorWidth, setVariableEditorWidth] = React.useState(
    DEFAULT_GRAPHQL_VARIABLE_WIDTH,
  );

  const { closeEditorLink } = useContext(ApiEditorContext);

  /**
   * Variable Editor's resizeable handler for the changing of width
   */
  const onVariableEditorWidthChange = useCallback((newWidth) => {
    setVariableEditorWidth(newWidth);
  }, []);

  const { onMouseDown, onMouseUp, onTouchStart, resizing } =
    useHorizontalResize(
      sizeableRef,
      onVariableEditorWidthChange,
      undefined,
      true,
    );

  return (
    <CommonEditorForm
      {...props}
      bodyUIComponent={
        <BodyWrapper>
          <QueryEditor
            dataTreePath={`${actionName}.config.body`}
            height="100%"
            name="actionConfiguration.body"
            theme={theme}
          />
          <div
            className={`w-2 h-full -ml-2 group  cursor-ew-resize ${tailwindLayers.resizer}`}
            onMouseDown={onMouseDown}
            onTouchEnd={onMouseUp}
            onTouchStart={onTouchStart}
          >
            <ResizerHandler
              className={classNames({
                "transform transition": true,
              })}
              resizing={resizing}
            />
          </div>
          <ResizeableDiv
            ref={sizeableRef}
            style={{
              width: `${variableEditorWidth}px`,
              paddingRight: "2px",
            }}
          >
            <VariableEditor actionName={actionName} theme={theme} />
          </ResizeableDiv>
        </BodyWrapper>
      }
      closeEditorLink={closeEditorLink}
      defaultTabSelected={2}
      formName={API_EDITOR_FORM_NAME}
      paginationUIComponent={
        <Pagination
          actionName={actionName}
          formName={API_EDITOR_FORM_NAME}
          onTestClick={props.onRunClick}
          paginationType={props.paginationType}
          query={props.actionConfigurationBody}
        />
      }
    />
  );
}

const selector = formValueSelector(API_EDITOR_FORM_NAME);

interface ReduxDispatchProps {
  updateDatasource: (datasource: Datasource) => void;
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  updateDatasource: (datasource) => {
    dispatch(change(API_EDITOR_FORM_NAME, "datasource", datasource));
  },
});

export default connect(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (state: AppState, props: { pluginId: string; match?: any }) => {
    const httpMethodFromForm = selector(
      state,
      "actionConfiguration.httpMethod",
    );
    const actionConfigurationHeaders =
      selector(state, "actionConfiguration.headers") || [];
    const actionConfigurationParams =
      selector(state, "actionConfiguration.queryParameters") || [];
    let datasourceFromAction = selector(state, "datasource");
    if (datasourceFromAction && datasourceFromAction.hasOwnProperty("id")) {
      datasourceFromAction = state.entities.datasources.list.find(
        (d) => d.id === datasourceFromAction.id,
      );
    }

    const { baseApiId, baseQueryId } = props.match?.params || {};
    const baseActionId = baseQueryId || baseApiId;
    const action = getActionByBaseId(state, baseActionId);
    const apiId = action?.id ?? "";
    const actionName = action?.name ?? "";
    const hintMessages = action?.messages;

    const datasourceHeaders =
      get(datasourceFromAction, "datasourceConfiguration.headers") || [];
    const datasourceParams =
      get(datasourceFromAction, "datasourceConfiguration.queryParameters") ||
      [];

    const currentActionDatasourceId = selector(state, "datasource.id");

    const headers = selector(state, "actionConfiguration.headers");
    let headersCount = 0;

    if (Array.isArray(headers)) {
      const validHeaders = headers.filter(
        (value) => value.key && value.key !== "",
      );
      headersCount += validHeaders.length;
    }

    if (Array.isArray(datasourceHeaders)) {
      const validHeaders = datasourceHeaders.filter(
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (value: any) => value.key && value.key !== "",
      );
      headersCount += validHeaders.length;
    }

    const params = selector(state, "actionConfiguration.queryParameters");
    let paramsCount = 0;

    if (Array.isArray(params)) {
      const validParams = params.filter(
        (value) => value.key && value.key !== "",
      );
      paramsCount = validParams.length;
    }

    if (Array.isArray(datasourceParams)) {
      const validParams = datasourceParams.filter(
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (value: any) => value.key && value.key !== "",
      );
      paramsCount += validParams.length;
    }

    const actionConfigurationBody =
      selector(state, "actionConfiguration.body") || "";

    let hasResponse = false;
    let suggestedWidgets;
    const actionResponse = getActionData(state, apiId);
    if (actionResponse) {
      hasResponse =
        !isEmpty(actionResponse.statusCode) &&
        actionResponse.statusCode[0] === "2";
      suggestedWidgets = actionResponse.suggestedWidgets;
    }

    const actionData = getActionData(state, apiId);
    const { responseDataTypes, responseDisplayFormat } =
      actionResponseDisplayDataFormats(actionData);

    return {
      actionName,
      actionResponse,
      apiId,
      httpMethodFromForm,
      actionConfigurationHeaders,
      actionConfigurationParams,
      actionConfigurationBody,
      currentActionDatasourceId,
      datasourceHeaders,
      datasourceParams,
      headersCount,
      paramsCount,
      hintMessages,
      datasources: state.entities.datasources.list.filter(
        (d) => d.pluginId === props.pluginId,
      ),
      currentPageId: state.entities.pageList.currentPageId,
      applicationId: state.entities.pageList.applicationId,
      responseDataTypes,
      responseDisplayFormat,
      suggestedWidgets,
      hasResponse,
    };
  },
  mapDispatchToProps,
)(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reduxForm<Action, any>({
    form: API_EDITOR_FORM_NAME,
    enableReinitialize: true,
  })(GraphQLEditorForm),
);
