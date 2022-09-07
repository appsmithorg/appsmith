import React from "react";
import { connect, useSelector } from "react-redux";
import {
  change,
  formValueSelector,
  InjectedFormProps,
  reduxForm,
} from "redux-form";
import { HTTP_METHOD_OPTIONS } from "constants/ApiEditorConstants";
import styled from "styled-components";
import FormLabel from "components/editorComponents/FormLabel";
import FormRow from "components/editorComponents/FormRow";
import { PaginationField, SuggestedWidget } from "api/ActionAPI";
import { API_EDITOR_FORM_NAME } from "@appsmith/constants/forms";
import { Action, PaginationType } from "entities/Action";
import ApiResponseView, {
  EMPTY_RESPONSE,
} from "components/editorComponents/ApiResponseView";
import EmbeddedDatasourcePathField from "components/editorComponents/form/fields/EmbeddedDatasourcePathField";
import { AppState } from "@appsmith/reducers";
import { getApiName } from "selectors/formSelectors";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import RequestDropdownField from "components/editorComponents/form/fields/RequestDropdownField";
import MoreActionsMenu from "../Explorer/Actions/MoreActionsMenu";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { Button, Size } from "design-system";
import { Variant } from "components/ads/common";
import Callout from "components/ads/Callout";
import CloseEditor from "components/editorComponents/CloseEditor";
import { useParams } from "react-router";
import DataSourceList from "./ApiRightPane";
import { Datasource } from "entities/Datasource";
import {
  getAction,
  getActionData,
  getActionResponses,
} from "selectors/entitiesSelector";
import { isEmpty } from "lodash";
import equal from "fast-deep-equal/es6";

import { Colors } from "constants/Colors";
import SearchSnippets from "components/ads/SnippetButton";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { replayHighlightClass } from "globalStyles/portals";
import ApiConfigTabs from "pages/Editor/APIEditor/ApiConfigTabs";
import { FormSettingsConfigs } from "utils/DynamicBindingUtils";

const Form = styled.form`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  width: 100%;
  ${FormLabel} {
    padding: ${(props) => props.theme.spaces[3]}px;
  }
  ${FormRow} {
    align-items: center;
    ${FormLabel} {
      padding: 0;
      width: 100%;
    }
  }
  .api-info-row {
    input {
      margin-left: ${(props) => props.theme.spaces[1] + 1}px;
    }
  }
`;

const MainConfiguration = styled.div`
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[10]}px 0px
    ${(props) => props.theme.spaces[10]}px;
  .api-info-row {
    svg {
      fill: #ffffff;
    }
    .t--apiFormHttpMethod:hover {
      background: ${Colors.CODE_GRAY};
    }
  }
`;

const ActionButtons = styled.div`
  justify-self: flex-end;
  display: flex;
  align-items: center;

  button:last-child {
    margin-left: ${(props) => props.theme.spaces[7]}px;
  }
`;

export const HelpSection = styled.div`
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[12]}px ${(props) => props.theme.spaces[6]}px
    ${(props) => props.theme.spaces[12]}px;
`;

const DatasourceWrapper = styled.div`
  width: 100%;
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 100%;
  width: 100%;
  ${HelpSection} {
    margin-bottom: 10px;
  }
`;

export const TabbedViewContainer = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;
  height: 100%;
  border-top: 1px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  ${FormRow} {
    min-height: auto;
    padding: ${(props) => props.theme.spaces[0]}px;
    & > * {
      margin-right: 0px;
    }
  }

  &&& {
    ul.react-tabs__tab-list {
      margin: 0px ${(props) => props.theme.spaces[11]}px;
      background-color: ${(props) =>
        props.theme.colors.apiPane.responseBody.bg};
      li.react-tabs__tab--selected {
        > div {
          color: ${(props) => props.theme.colors.apiPane.closeIcon};
        }
      }
    }
    .react-tabs__tab-panel {
      height: calc(100% - 36px);
      background-color: ${(props) => props.theme.colors.apiPane.tabBg};
      .eye-on-off {
        svg {
          fill: ${(props) =>
            props.theme.colors.apiPane.requestTree.header.icon};
          &:hover {
            fill: ${(props) =>
              props.theme.colors.apiPane.requestTree.header.icon};
          }
          path {
            fill: unset;
          }
        }
      }
    }
  }
`;

export const BindingText = styled.span`
  color: ${(props) => props.theme.colors.bindingTextDark};
  font-weight: 700;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100% - 110px);
  position: relative;
`;

type ReduxDispatchProps = {
  updateDatasource: (datasource: Datasource) => void;
};

type ReduxStateProps = {
  actionName: string;
  currentActionDatasourceId: string;
  hintMessages?: Array<string>;
  datasources: Datasource[];
  currentPageId: string;
  applicationId: string;
  responseDataTypes: { key: string; title: string }[];
  responseDisplayFormat: { title: string; value: string };
  suggestedWidgets?: SuggestedWidget[];
  hasResponse: boolean;
};

interface APIFormProps {
  pluginId: string;
  onRunClick: (paginationField?: PaginationField) => void;
  onDeleteClick: () => void;
  isRunning: boolean;
  isDeleting: boolean;
  paginationType: PaginationType;
  appName: string;
  apiName: string;
  settingsConfig: FormSettingsConfigs;
}

type Props = APIFormProps &
  ReduxStateProps &
  ReduxDispatchProps &
  InjectedFormProps<Action, APIFormProps>;

export const NameWrapper = styled.div`
  display: flex;
  align-items: center;
  input {
    margin: 0;
    box-sizing: border-box;
  }
`;

export const ShowHideImportedHeaders = styled.button`
  background: #ebebeb;
  color: #4b4848;
  padding: 3px 5px;
  border: none;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 12px;
  height: 20px;
`;

const BoundaryContainer = styled.div`
  border: 1px solid transparent;
  border-right: none;
`;

function ApiEditorForm(props: Props) {
  const {
    actionName,
    currentActionDatasourceId,
    handleSubmit,
    hintMessages,
    isRunning,
    onRunClick,
    paginationType,
    pluginId,
    responseDataTypes,
    responseDisplayFormat,
    settingsConfig,
    updateDatasource,
  } = props;

  const params = useParams<{
    apiId?: string;
    queryId?: string;
    pageId: string;
  }>();

  // passing lodash's equality function to ensure that this selector does not cause a rerender multiple times.
  // it checks each value to make sure none has changed before recomputing the actions.
  const actions: Action[] = useSelector(
    (state: AppState) => state.entities.actions.map((action) => action.config),
    equal,
  );
  const currentActionConfig: Action | undefined = actions.find(
    (action) => action.id === params.apiId || action.id === params.queryId,
  );

  const theme = EditorTheme.LIGHT;

  return (
    <>
      <CloseEditor />
      <Form onSubmit={handleSubmit}>
        <MainConfiguration>
          <FormRow className="form-row-header">
            <NameWrapper className="t--nameOfApi">
              <ActionNameEditor page="API_PANE" />
            </NameWrapper>
            <ActionButtons className="t--formActionButtons">
              <MoreActionsMenu
                className="t--more-action-menu"
                id={currentActionConfig ? currentActionConfig.id : ""}
                name={currentActionConfig ? currentActionConfig.name : ""}
                pageId={params.pageId}
              />
              <SearchSnippets
                entityId={currentActionConfig?.id}
                entityType={ENTITY_TYPE.ACTION}
              />
              <Button
                className="t--apiFormRunBtn"
                isLoading={isRunning}
                onClick={() => {
                  onRunClick();
                }}
                size={Size.medium}
                tag="button"
                text="Run"
                type="button"
              />
            </ActionButtons>
          </FormRow>
          <FormRow className="api-info-row">
            <BoundaryContainer
              data-replay-id={btoa("actionConfiguration.httpMethod")}
            >
              <RequestDropdownField
                className={`t--apiFormHttpMethod ${replayHighlightClass}`}
                height={"35px"}
                name="actionConfiguration.httpMethod"
                optionWidth={"110px"}
                options={HTTP_METHOD_OPTIONS}
                placeholder="Method"
                width={"110px"}
              />
            </BoundaryContainer>
            <DatasourceWrapper className="t--dataSourceField">
              <EmbeddedDatasourcePathField
                actionName={actionName}
                codeEditorVisibleOverflow
                name="actionConfiguration.path"
                placeholder="https://mock-api.appsmith.com/users"
                pluginId={pluginId}
                theme={theme}
              />
            </DatasourceWrapper>
          </FormRow>
        </MainConfiguration>
        {hintMessages && (
          <HelpSection>
            {hintMessages.map((msg, i) => (
              <Callout fill key={i} text={msg} variant={Variant.warning} />
            ))}
          </HelpSection>
        )}
        <Wrapper>
          <SecondaryWrapper>
            <ApiConfigTabs
              onRunClick={onRunClick}
              paginationType={paginationType}
              settingsConfig={settingsConfig}
              theme={theme}
            />
            <ApiResponseView
              apiName={actionName}
              onRunClick={onRunClick}
              responseDataTypes={responseDataTypes}
              responseDisplayFormat={responseDisplayFormat}
              theme={theme}
            />
          </SecondaryWrapper>
          <DataSourceList
            actionName={actionName}
            applicationId={props.applicationId}
            currentActionDatasourceId={currentActionDatasourceId}
            currentPageId={props.currentPageId}
            datasources={props.datasources}
            hasResponse={props.hasResponse}
            onClick={updateDatasource}
            suggestedWidgets={props.suggestedWidgets}
          />
        </Wrapper>
      </Form>
    </>
  );
}

const selector = formValueSelector(API_EDITOR_FORM_NAME);

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  updateDatasource: (datasource) => {
    dispatch(change(API_EDITOR_FORM_NAME, "datasource", datasource));
  },
});

const mapStateToProps = (
  state: AppState,
  ownProps: { pluginId: string },
): ReduxStateProps => {
  // get messages from action itself
  const actionId = selector(state, "id");
  const action = getAction(state, actionId);
  const hintMessages = action?.messages;

  const apiId = selector(state, "id");
  const currentActionDatasourceId = selector(state, "datasource.id");

  const actionName = getApiName(state, apiId) || "";

  const datasources = state.entities.datasources.list.filter(
    (d) => d.pluginId === ownProps.pluginId,
  );

  const responses = getActionResponses(state);
  let hasResponse = false;
  let suggestedWidgets;
  if (apiId && apiId in responses) {
    const response = responses[apiId] || EMPTY_RESPONSE;
    hasResponse =
      !isEmpty(response.statusCode) && response.statusCode[0] === "2";
    suggestedWidgets = response.suggestedWidgets;
  }

  const actionData = getActionData(state, apiId);
  let responseDisplayFormat: { title: string; value: string };
  let responseDataTypes: { key: string; title: string }[];
  if (!!actionData && actionData.responseDisplayFormat) {
    responseDataTypes = actionData.dataTypes.map((data) => {
      return {
        key: data.dataType,
        title: data.dataType,
      };
    });
    responseDisplayFormat = {
      title: actionData.responseDisplayFormat,
      value: actionData.responseDisplayFormat,
    };
  } else {
    responseDataTypes = [];
    responseDisplayFormat = {
      title: "",
      value: "",
    };
  }

  return {
    actionName,
    currentActionDatasourceId,
    hintMessages,
    datasources,
    currentPageId: state.entities.pageList.currentPageId,
    applicationId: state.entities.pageList.applicationId,
    responseDataTypes,
    responseDisplayFormat,
    suggestedWidgets,
    hasResponse,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  reduxForm<Action, APIFormProps>({
    form: API_EDITOR_FORM_NAME,
    enableReinitialize: true,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
  })(ApiEditorForm),
);
