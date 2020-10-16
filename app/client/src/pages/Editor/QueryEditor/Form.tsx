import React from "react";
import { formValueSelector, InjectedFormProps, reduxForm } from "redux-form";
import styled, { createGlobalStyle } from "styled-components";
import { Icon, Popover, Spinner, Tag } from "@blueprintjs/core";
import {
  components,
  MenuListComponentProps,
  OptionProps,
  OptionTypeBase,
  SingleValueProps,
} from "react-select";
import { isString } from "lodash";
import history from "utils/history";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import Button from "components/editorComponents/Button";
import FormRow from "components/editorComponents/FormRow";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import { Datasource } from "api/DatasourcesApi";
import { BaseTabbedView } from "components/designSystems/appsmith/TabbedView";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { Colors } from "constants/Colors";
import JSONViewer from "./JSONViewer";
import Table from "./Table";
import { RestAction } from "entities/Action";
import { connect, useDispatch } from "react-redux";
import { AppState } from "reducers";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import CollapsibleHelp from "components/designSystems/appsmith/help/CollapsibleHelp";
import {
  getPluginResponseTypes,
  getPluginDocumentationLinks,
} from "selectors/entitiesSelector";

import FormControlFactory from "utils/FormControlFactory";
import { ControlProps } from "components/formControls/BaseControl";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import ActionSettings from "pages/Editor/ActionSettings";
import { queryActionSettingsConfig } from "mockResponses/ActionSettings";
import { addTableWidgetFromQuery } from "actions/widgetActions";

const QueryFormContainer = styled.div`
  padding: 20px 32px;
  width: 100%;
  display: flex;
  flex-direction: column;
  height: calc(100vh - ${props => props.theme.headerHeight});
  a {
    font-size: 14px;
    line-height: 20px;
    margin-top: 15px;
  }
  .statementTextArea {
    font-size: 14px;
    line-height: 20px;
    color: #2e3d49;
    margin-top: 5px;
  }

  .queryInput {
    max-width: 30%;
    padding-right: 10px;
  }
  span.bp3-popover-target {
    display: initial !important;
  }

  .executeOnLoad {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
`;

const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 1 1 50%;
  justify-content: flex-end;
`;

const ActionButtons = styled.div`
  display: flex;
  margin-left: 10px;
  flex: 0 1 150px;
  justify-content: flex-end;
`;

const ActionButton = styled(BaseButton)`
  &&& {
    max-width: 72px;
    margin: 0 5px;
    min-height: 30px;
  }
`;

const DropdownSelect = styled.div`
  font-size: 14px;
`;

const NoDataSourceContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-top: 62px;
  flex: 1;
  .font18 {
    width: 50%;
    text-align: center;
    margin-bottom: 23px;
    font-size: 18px;
    color: #2e3d49;
  }
`;

const TooltipStyles = createGlobalStyle`
 .helper-tooltip{
  width: 378px;
  .bp3-popover {
    height: 137px;
    max-width: 378px;
    box-shadow: none;
    display: inherit !important;
    .bp3-popover-arrow {
      display: block;
      fill: none;
    }
    .bp3-popover-arrow-fill {
      fill:  #23292E;
    }
    .bp3-popover-content {
      padding: 15px;
      background-color: #23292E;
      color: #fff;
      text-align: left;
      border-radius: 4px;
      text-transform: initial;
      font-weight: 500;
      font-size: 16px;
      line-height: 20px;
    }
    .popoverBtn {
      float: right;
      margin-top: 25px;
    }
    .popuptext {
      padding-right: 30px;
    }
  }
 }
`;

const ErrorMessage = styled.p`
  font-size: 14px;
  color: ${Colors.RED};
  display: inline-block;
  margin-right: 10px;
`;
const CreateDatasource = styled.div`
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-top: 1px solid ${Colors.ATHENS_GRAY};
  :hover {
    cursor: pointer;
  }

  .createIcon {
    margin-right: 6px;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  .plugin-image {
    height: 20px;
    width: auto;
  }

  .selected-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: no-wrap;
    margin-left: 6px;
  }
`;

const StyledOpenDocsIcon = styled(Icon)`
  svg {
    width: 12px;
    height: 18px;
  }
`;

const NameWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  input {
    margin: 0;
    box-sizing: border-box;
  }
`;

const CollapsibleWrapper = styled.div`
  width: 200px;
`;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

const TabContainerView = styled.div`
  height: calc(100vh / 3);

  .react-tabs__tab-panel {
    border: 1px solid #ebeff2;
  }
  .react-tabs__tab-list {
    margin: 0px;
  }
`;

const SettingsWrapper = styled.div`
  padding-left: 15px;
  padding-top: 8px;
  padding-bottom: 8px;
`;

const AddWidgetButton = styled(BaseButton)`
  &&&& {
    max-width: 125px;
    border: 1px solid ${Colors.GEYSER_LIGHT};
  }
`;

const OutputHeader = styled.div`
  flex-direction: row;
  justify-content: space-between;
  display: flex;
  margin-bottom: 10px;
  align-items: center;
`;

type QueryFormProps = {
  onDeleteClick: () => void;
  onRunClick: () => void;
  isDeleting: boolean;
  isRunning: boolean;
  dataSources: Datasource[];
  DATASOURCES_OPTIONS: any;
  executedQueryData: {
    body: Record<string, any>[] | string;
  };
  applicationId: string;
  runErrorMessage: string | undefined;
  pageId: string;
  location: {
    state: any;
  };
  editorConfig?: any;
  loadingFormConfigs: boolean;
};

type ReduxProps = {
  actionName: string;
  responseType: string | undefined;
  pluginId: string;
  documentationLink: string | undefined;
};

export type StateAndRouteProps = QueryFormProps & ReduxProps;

type Props = StateAndRouteProps &
  InjectedFormProps<RestAction, StateAndRouteProps>;

const QueryEditorForm: React.FC<Props> = (props: Props) => {
  const {
    handleSubmit,
    isDeleting,
    isRunning,
    onRunClick,
    onDeleteClick,
    DATASOURCES_OPTIONS,
    pageId,
    applicationId,
    dataSources,
    executedQueryData,
    runErrorMessage,
    responseType,
    documentationLink,
    loadingFormConfigs,
    editorConfig,
    actionName,
  } = props;

  let error = runErrorMessage;
  let output: Record<string, any>[] | null = null;

  if (executedQueryData) {
    if (isString(executedQueryData.body)) {
      error = executedQueryData.body;
    } else {
      output = executedQueryData.body;
    }
  }

  const isSQL = responseType === "TABLE";

  const dispatch = useDispatch();
  const onAddWidget = () => {
    dispatch(addTableWidgetFromQuery(actionName));
  };

  const MenuList = (props: MenuListComponentProps<{ children: Node }>) => {
    return (
      <>
        <components.MenuList {...props}>{props.children}</components.MenuList>
        <CreateDatasource
          onClick={() => {
            history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId));
          }}
        >
          <Icon icon="plus" iconSize={11} className="createIcon" />
          Create new datasource
        </CreateDatasource>
      </>
    );
  };

  const SingleValue = (props: SingleValueProps<OptionTypeBase>) => {
    return (
      <>
        <components.SingleValue {...props}>
          <Container>
            <img
              className="plugin-image"
              src={props.data.image}
              alt="Datasource"
            />
            <div className="selected-value">{props.children}</div>
          </Container>
        </components.SingleValue>
      </>
    );
  };

  const CustomOption = (props: OptionProps<OptionTypeBase>) => {
    return (
      <>
        <components.Option {...props}>
          <Container>
            <img
              className="plugin-image"
              src={props.data.image}
              alt="Datasource"
            />
            <div style={{ marginLeft: "6px" }}>{props.children}</div>
          </Container>
        </components.Option>
      </>
    );
  };

  if (loadingFormConfigs) {
    return (
      <LoadingContainer>
        <Spinner size={30} />
      </LoadingContainer>
    );
  }

  return (
    <QueryFormContainer>
      <form onSubmit={handleSubmit}>
        <FormRow>
          <NameWrapper>
            <ActionNameEditor />
          </NameWrapper>
          <ActionsWrapper>
            <DropdownSelect>
              <DropdownField
                placeholder="Datasource"
                name="datasource.id"
                options={DATASOURCES_OPTIONS}
                width={232}
                maxMenuHeight={200}
                components={{ MenuList, Option: CustomOption, SingleValue }}
              />
            </DropdownSelect>
            <ActionButtons>
              <ActionButton
                className="t--delete-query"
                text="Delete"
                accent="error"
                loading={isDeleting}
                onClick={onDeleteClick}
              />
              {dataSources.length === 0 ? (
                <>
                  <TooltipStyles />
                  <Popover
                    autoFocus={true}
                    canEscapeKeyClose={true}
                    content="You don’t have a Data Source to run this query"
                    position="bottom"
                    defaultIsOpen={false}
                    usePortal
                    portalClassName="helper-tooltip"
                  >
                    <ActionButton
                      className="t--run-query"
                      text="Run"
                      filled
                      loading={isRunning}
                      accent="primary"
                      onClick={onRunClick}
                    />
                    <div>
                      <p className="popuptext">
                        You don’t have a Data Source to run this query
                      </p>
                      <Button
                        onClick={() =>
                          history.push(
                            DATA_SOURCES_EDITOR_URL(applicationId, pageId),
                          )
                        }
                        text="Add Datasource"
                        intent="primary"
                        filled
                        size="small"
                        className="popoverBtn"
                      />
                    </div>
                  </Popover>
                </>
              ) : (
                <ActionButton
                  className="t--run-query"
                  text="Run"
                  filled
                  loading={isRunning}
                  accent="primary"
                  onClick={onRunClick}
                />
              )}
            </ActionButtons>
          </ActionsWrapper>
        </FormRow>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <p className="statementTextArea">Query Statement</p>

          {documentationLink && (
            <CollapsibleWrapper>
              <CollapsibleHelp>
                <a
                  href={documentationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {"Documentation "}
                  <StyledOpenDocsIcon icon="document-open" />
                </a>
              </CollapsibleHelp>
            </CollapsibleWrapper>
          )}
        </div>

        <TabContainerView>
          <BaseTabbedView
            tabs={[
              {
                key: "query",
                title: "Query",
                panelComponent:
                  editorConfig && editorConfig.length > 0 ? (
                    editorConfig.map(renderEachConfig)
                  ) : (
                    <>
                      <ErrorMessage>An unexpected error occurred</ErrorMessage>
                      <Tag
                        round
                        intent="warning"
                        interactive
                        minimal
                        onClick={() => window.location.reload()}
                      >
                        Refresh
                      </Tag>
                    </>
                  ),
              },
              {
                key: "settings",
                title: "Settings",
                panelComponent: (
                  <SettingsWrapper>
                    <ActionSettings
                      actionSettingsConfig={queryActionSettingsConfig}
                    />
                  </SettingsWrapper>
                ),
              },
            ]}
          />
        </TabContainerView>
      </form>

      {dataSources.length === 0 && (
        <NoDataSourceContainer>
          <p className="font18">
            Seems like you don’t have any Datasources to create a query
          </p>
          <Button
            onClick={() =>
              history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId))
            }
            text="Add a Datasource"
            intent="primary"
            filled
            size="small"
            icon="plus"
          />
        </NoDataSourceContainer>
      )}

      {error && (
        <>
          <p className="statementTextArea">Query error</p>
          <ErrorMessage>{error}</ErrorMessage>
        </>
      )}

      {!error && output && dataSources.length && (
        <>
          <OutputHeader>
            <p className="statementTextArea">
              {output.length ? "Query response" : "No data records to display"}
            </p>
            {!!output.length && (
              <AddWidgetButton
                className="t--add-widget"
                icon={"plus"}
                text="Add Widget"
                onClick={onAddWidget}
              />
            )}
          </OutputHeader>
          {isSQL ? <Table data={output} /> : <JSONViewer src={output} />}
        </>
      )}
    </QueryFormContainer>
  );
};

const renderEachConfig = (section: any): any => {
  return section.children.map((propertyControlOrSection: ControlProps) => {
    if ("children" in propertyControlOrSection) {
      return renderEachConfig(propertyControlOrSection);
    } else {
      try {
        const { configProperty } = propertyControlOrSection;
        return (
          <div key={configProperty} style={{ marginTop: "8px" }}>
            {FormControlFactory.createControl(
              { ...propertyControlOrSection },
              {},
              false,
            )}
          </div>
        );
      } catch (e) {
        console.log(e);
      }
    }
    return null;
  });
};

const valueSelector = formValueSelector(QUERY_EDITOR_FORM_NAME);
const mapStateToProps = (state: AppState) => {
  const actionName = valueSelector(state, "name");
  const pluginId = valueSelector(state, "datasource.pluginId");
  const responseTypes = getPluginResponseTypes(state);
  const documentationLinks = getPluginDocumentationLinks(state);

  return {
    actionName,
    pluginId,
    responseType: responseTypes[pluginId],
    documentationLink: documentationLinks[pluginId],
  };
};

export default connect(mapStateToProps)(
  reduxForm<RestAction, StateAndRouteProps>({
    form: QUERY_EDITOR_FORM_NAME,
    enableReinitialize: true,
  })(QueryEditorForm),
);
