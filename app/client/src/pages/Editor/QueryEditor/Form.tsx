import React, { useEffect, useRef, useState } from "react";
import {
  FormSubmitHandler,
  formValueSelector,
  InjectedFormProps,
  reduxForm,
} from "redux-form";
import CheckboxField from "components/editorComponents/form/fields/CheckboxField";
import styled, { createGlobalStyle } from "styled-components";
import { Icon, Popover } from "@blueprintjs/core";
import {
  components,
  MenuListComponentProps,
  OptionProps,
  OptionTypeBase,
  SingleValueProps,
} from "react-select";
import history from "utils/history";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import TemplateMenu from "./TemplateMenu";
import Button from "components/editorComponents/Button";
import FormRow from "components/editorComponents/FormRow";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import { Datasource } from "api/DatasourcesApi";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { PLUGIN_PACKAGE_POSTGRES } from "constants/QueryEditorConstants";
import { Colors } from "constants/Colors";
import JSONViewer from "./JSONViewer";
import Table from "./Table";
import { RestAction } from "entities/Action";
import { connect } from "react-redux";
import { AppState } from "reducers";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";

const QueryFormContainer = styled.div`
  font-size: 20px;
  padding: 20px 32px;
  width: 100%;
  max-height: 93vh;
  a {
    font-size: 14px;
    line-height: 20px;
    margin-top: 15px;
  }

  .textAreaStyles {
    border-radius: 4px;
    border: 1px solid #d0d7dd;
    font-size: 14px;
    height: calc(100vh / 3);
  }
  .statementTextArea {
    font-size: 14px;
    line-height: 20px;
    color: #2e3d49;
    margin-top: 15px;
  }

  && {
    .CodeMirror-lines {
      padding: 16px 20px;
    }
  }

  .queryInput {
    max-width: 30%;
    padding-right: 10px;
  }
  span.bp3-popover-target {
    display: initial !important;
  }
`;

const ActionButtons = styled.div`
  flex: 1;
  margin-left: 10px;
`;

const ActionButton = styled(BaseButton)`
  &&& {
    max-width: 72px;
    margin: 0 5px;
    min-height: 30px;
  }
`;

const ResponseContainer = styled.div`
  margin-top: 20px;
`;

const ResponseContent = styled.div`
  height: calc(
    100vh - (100vh / 3) - 175px - ${props => props.theme.headerHeight}
  );
  overflow: auto;
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

const StyledCheckbox = styled(CheckboxField)`
  &&& {
    font-size: 14px;
    margin-top: 10px;
  }
`;

type QueryFormProps = {
  onDeleteClick: () => void;
  onSaveClick: () => void;
  onRunClick: () => void;
  createTemplate: (template: any) => void;
  onSubmit: FormSubmitHandler<RestAction>;
  isDeleting: boolean;
  allowSave: boolean;
  isSaving: boolean;
  isRunning: boolean;
  dataSources: Datasource[];
  DATASOURCES_OPTIONS: any;
  executedQueryData: {
    body: Record<string, any>[];
  };
  applicationId: string;
  selectedPluginPackage: string;
  runErrorMessage: string | undefined;
  pageId: string;
  location: {
    state: any;
  };
};

type ReduxProps = {
  actionName: string;
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
    selectedPluginPackage,
    createTemplate,
    runErrorMessage,
  } = props;

  const [showTemplateMenu, setMenuVisibility] = useState(true);

  const isSQL = selectedPluginPackage === PLUGIN_PACKAGE_POSTGRES;
  const isNewQuery = props.location.state?.newQuery ?? false;
  let queryOutput: {
    body: Record<string, any>[];
  } = { body: [] };
  const inputEl = useRef<HTMLInputElement>();

  if (executedQueryData) {
    if (isSQL && executedQueryData.body.length) {
      queryOutput = executedQueryData;
    }
  }

  useEffect(() => {
    if (isNewQuery) {
      inputEl.current?.select();
    }
  }, [isNewQuery]);

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

  return (
    <QueryFormContainer>
      <form onSubmit={handleSubmit}>
        <FormRow>
          <ActionNameEditor />
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
                    accent="primary"
                    loading={isRunning}
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
                loading={isRunning}
                accent="secondary"
                onClick={onRunClick}
              />
            )}
          </ActionButtons>
        </FormRow>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <p className="statementTextArea">Query Statement</p>
          {isSQL ? (
            <a
              href="https://www.postgresql.org/docs/12/index.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              PostgreSQL docs
            </a>
          ) : (
            <a
              href="https://docs.mongodb.com/manual/reference/command/nav-crud/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mongo docs
            </a>
          )}
        </div>
        {isNewQuery && showTemplateMenu ? (
          <TemplateMenu
            createTemplate={templateString => {
              setMenuVisibility(false);
              createTemplate(templateString);
            }}
            selectedPluginPackage={selectedPluginPackage}
          />
        ) : isSQL ? (
          <DynamicTextField
            name="actionConfiguration.body"
            dataTreePath={`${props.actionName}.config.body`}
            className="textAreaStyles"
            mode={EditorModes.SQL_WITH_BINDING}
          />
        ) : (
          <DynamicTextField
            name="actionConfiguration.body"
            dataTreePath={`${props.actionName}.config.body`}
            className="textAreaStyles"
            mode={EditorModes.JSON_WITH_BINDING}
          />
        )}
        <StyledCheckbox
          intent="primary"
          name="executeOnLoad"
          align="left"
          label="Run on Page Load"
        />
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

      {runErrorMessage && (
        <>
          <p className="statementTextArea">Query error</p>
          <ErrorMessage>{runErrorMessage}</ErrorMessage>
        </>
      )}

      {executedQueryData && dataSources.length && (
        <ResponseContainer>
          <p className="statementTextArea">
            {executedQueryData.body.length
              ? "Query response"
              : "No data records to display"}
          </p>

          {isSQL ? (
            <Table data={queryOutput.body} />
          ) : (
            <ResponseContent>
              <JSONViewer src={executedQueryData.body} />
            </ResponseContent>
          )}
        </ResponseContainer>
      )}
    </QueryFormContainer>
  );
};

const valueSelector = formValueSelector(QUERY_EDITOR_FORM_NAME);
const mapStateToProps = (state: AppState) => {
  const actionName = valueSelector(state, "name");
  return {
    actionName,
  };
};

export default connect(mapStateToProps)(
  reduxForm<RestAction, StateAndRouteProps>({
    form: QUERY_EDITOR_FORM_NAME,
    enableReinitialize: true,
  })(QueryEditorForm),
);
