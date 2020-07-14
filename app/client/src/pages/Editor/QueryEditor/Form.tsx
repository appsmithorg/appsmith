import React, { useState } from "react";
import { formValueSelector, InjectedFormProps, reduxForm } from "redux-form";
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
import _ from "lodash";
import history from "utils/history";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import TemplateMenu from "./TemplateMenu";
import Button from "components/editorComponents/Button";
import FormRow from "components/editorComponents/FormRow";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import { Datasource } from "api/DatasourcesApi";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { Colors } from "constants/Colors";
import JSONViewer from "./JSONViewer";
import Table from "./Table";
import { RestAction } from "entities/Action";
import { connect } from "react-redux";
import { AppState } from "reducers";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import {
  EditorModes,
  EditorSize,
} from "components/editorComponents/CodeEditor/EditorConfig";
import CollapsibleHelp from "components/designSystems/appsmith/help/CollapsibleHelp";
import { HelpBaseURL, HelpMap } from "constants/HelpConstants";
import {
  getPluginResponseTypes,
  getPluginDocumentationLinks,
} from "selectors/entitiesSelector";

const QueryFormContainer = styled.div`
  padding: 20px 32px;
  width: 100%;
  height: calc(100vh - ${props => props.theme.headerHeight});
  a {
    font-size: 14px;
    line-height: 20px;
    margin-top: 15px;
  }

  .textAreaStyles {
    border-radius: 4px;
    border: 1px solid #d0d7dd;
    font-size: 14px;
    height: calc(100vh / 4);
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

const StyledOpenDocsIcon = styled(Icon)`
  svg {
    width: 12px;
    height: 18px;
  }
`;

const NameWrapper = styled.div`
  width: 39%;
  display: flex;
  justify-content: space-between;
  input {
    margin: 0;
    box-sizing: border-box;
  }
`;

type QueryFormProps = {
  onDeleteClick: () => void;
  onRunClick: () => void;
  createTemplate: (template: any) => void;
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
    createTemplate,
    runErrorMessage,
    pluginId,
    responseType,
    documentationLink,
  } = props;

  const [showTemplateMenu, setMenuVisibility] = useState(true);
  let error = runErrorMessage;
  let output: Record<string, any>[] | null = null;

  if (executedQueryData) {
    if (_.isString(executedQueryData.body)) {
      error = executedQueryData.body;
    } else {
      output = executedQueryData.body;
    }
  }

  const isSQL = responseType === "TABLE";
  const isNewQuery =
    new URLSearchParams(window.location.search).get("new") === "true";

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
          <NameWrapper>
            <ActionNameEditor />
          </NameWrapper>
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
        </FormRow>
        <CollapsibleHelp>
          <span>{`Having trouble taking inputs from widget?`}</span>
          <a
            href={`${HelpBaseURL}${HelpMap["API_BINDING"].path}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {" Learn How "}
            <StyledOpenDocsIcon icon="document-open" />
          </a>
        </CollapsibleHelp>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <p className="statementTextArea">Query Statement</p>

          {documentationLink && (
            <a
              href={documentationLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </a>
          )}
        </div>

        {isNewQuery && showTemplateMenu && pluginId ? (
          <TemplateMenu
            createTemplate={templateString => {
              setMenuVisibility(false);
              createTemplate(templateString);
            }}
            pluginId={pluginId}
          />
        ) : isSQL ? (
          <DynamicTextField
            size={EditorSize.EXTENDED}
            name="actionConfiguration.body"
            dataTreePath={`${props.actionName}.config.body`}
            className="textAreaStyles"
            mode={EditorModes.SQL_WITH_BINDING}
          />
        ) : (
          <DynamicTextField
            size={EditorSize.EXTENDED}
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

      {error && (
        <>
          <p className="statementTextArea">Query error</p>
          <ErrorMessage>{error}</ErrorMessage>
        </>
      )}

      {!error && output && dataSources.length && (
        <ResponseContainer>
          <p className="statementTextArea">
            {output.length ? "Query response" : "No data records to display"}
          </p>

          {isSQL ? <Table data={output} /> : <JSONViewer src={output} />}
        </ResponseContainer>
      )}
    </QueryFormContainer>
  );
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
