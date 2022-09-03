import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  HTTP_METHOD_OPTIONS,
  API_EDITOR_TABS,
} from "constants/ApiEditorConstants/CommonApiConstants";
import { GRAPHQL_HTTP_METHOD_OPTIONS } from "constants/ApiEditorConstants/GraphQLEditorConstants";
import styled from "styled-components";
import FormLabel from "components/editorComponents/FormLabel";
import FormRow from "components/editorComponents/FormRow";
import { PaginationField, SuggestedWidget } from "api/ActionAPI";
import { Action, isGraphqlPlugin, PaginationType } from "entities/Action";
import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import ApiResponseView from "components/editorComponents/ApiResponseView";
import EmbeddedDatasourcePathField from "components/editorComponents/form/fields/EmbeddedDatasourcePathField";
import { AppState } from "@appsmith/reducers";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import ActionSettings from "pages/Editor/ActionSettings";
import RequestDropdownField from "components/editorComponents/form/fields/RequestDropdownField";
import { ExplorerURLParams } from "../Explorer/helpers";
import MoreActionsMenu from "../Explorer/Actions/MoreActionsMenu";
import { TabComponent } from "components/ads/Tabs";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  Button,
  Icon,
  IconSize,
  Size,
  Text,
  Case,
  TextType,
} from "design-system";
import { Classes, Variant } from "components/ads/common";
import Callout from "components/ads/Callout";
import { useLocalStorage } from "utils/hooks/localstorage";
import {
  API_EDITOR_TAB_TITLES,
  createMessage,
  WIDGET_BIND_HELP,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import CloseEditor from "components/editorComponents/CloseEditor";
import { useParams } from "react-router";
import DataSourceList from "./ApiRightPane";
import { Datasource } from "entities/Datasource";
import equal from "fast-deep-equal/es6";

import { Colors } from "constants/Colors";
import SearchSnippets from "components/ads/SnippetButton";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import ApiAuthentication from "./ApiAuthentication";
import { TooltipComponent } from "design-system";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { Classes as BluePrintClasses } from "@blueprintjs/core";
import { replayHighlightClass } from "globalStyles/portals";
import { getPlugin } from "selectors/entitiesSelector";

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

const HelpSection = styled.div`
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

const SettingsWrapper = styled.div`
  padding: 16px 30px;
  height: 100%;
  ${FormLabel} {
    padding: 0px;
  }
`;

const TabSection = styled.div`
  background: white;
  height: 100%;
  overflow: auto;
`;

const CalloutContent = styled.div`
  display: flex;
  align-items: center;
`;

const Link = styled.a`
  display: flex;
  margin-left: ${(props) => props.theme.spaces[1] + 1}px;
  .${Classes.ICON} {
    margin-left: ${(props) => props.theme.spaces[1] + 1}px;
    margin-top: -2px;
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100% - 110px);
  position: relative;
`;
export interface CommonFormProps {
  pluginId: string;
  onRunClick: (paginationField?: PaginationField) => void;
  onDeleteClick: () => void;
  isRunning: boolean;
  isDeleting: boolean;
  paginationType: PaginationType;
  appName: string;
  actionConfigurationHeaders?: any;
  actionConfigurationParams?: any;
  datasourceHeaders?: any;
  datasourceParams?: any;
  actionName: string;
  apiId: string;
  apiName: string;
  headersCount: number;
  paramsCount: number;
  settingsConfig: any;
  hintMessages?: Array<string>;
  datasources?: any;
  currentPageId?: string;
  applicationId?: string;
  hasResponse: boolean;
  responseDataTypes: { key: string; title: string }[];
  responseDisplayFormat: { title: string; value: string };
  suggestedWidgets?: SuggestedWidget[];
  updateDatasource: (datasource: Datasource) => void;
  currentActionDatasourceId: string;
}

type CommonFormPropsWithExtraParams = CommonFormProps & {
  formName: string;
  // Body Tab Component which is passed on from the Parent Component
  bodyUIComponent: JSX.Element;
  // Pagination Tab Component which is passed on from the Parent Component
  paginationUIComponent: JSX.Element;
  handleSubmit: any;
  // defaultSelectedTabIndex
  defaultTabSelected?: number;
};

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

const Flex = styled.div<{ size: number }>`
  flex: ${(props) => props.size};
  ${(props) =>
    props.size === 3
      ? `
    margin-left: ${props.theme.spaces[4]}px;
  `
      : null};
  width: 100%;
  position: relative;
  min-height: 32px;
  height: auto;
  background-color: #fafafa;
  border-color: #d3dee3;
  border-bottom: 1px solid #e8e8e8;
  color: #4b4848;
  display: flex;
  align-items: center;

  &.possible-overflow-key {
    overflow: hidden;
    text-overflow: ellipsis;
    width: fit-content;
    max-width: 100%;

    .${BluePrintClasses.POPOVER_WRAPPER} {
      width: fit-content;
      max-width: 100%;
    }

    .${BluePrintClasses.POPOVER_TARGET} > span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      width: fit-content;
      max-width: 100%;
      padding-right: 8px;
    }
  }

  &.possible-overflow {
    width: 0;
    max-height: 32px;

    & > span.cs-text {
      width: 100%;
    }

    .${BluePrintClasses.POPOVER_TARGET} {
      width: fit-content;
      max-width: 100%;
    }

    .${BluePrintClasses.POPOVER_TARGET} > span {
      max-height: 32px;
      padding: 6px 12px;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-left: 2px;
      width: fit-content;
      max-width: 100%;
    }
  }
`;

const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  width: calc(100% - 30px);

  &.header {
    margin-bottom: 8px;
  }

  .key-value {
    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.apiPane.text};
      padding: ${(props) => props.theme.spaces[2]}px 0px
        ${(props) => props.theme.spaces[2]}px
        ${(props) => props.theme.spaces[5]}px;
    }
    border-bottom: 0px;
  }
  .key-value:nth-child(2) {
    margin-left: ${(props) => props.theme.spaces[4]}px;
  }
  .disabled {
    background: #e8e8e8;
    margin-bottom: ${(props) => props.theme.spaces[2] - 1}px;
  }
`;

const KeyValueStackContainer = styled.div`
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[14]}px 0
    ${(props) => props.theme.spaces[11] + 2}px;
`;
const FormRowWithLabel = styled(FormRow)`
  flex-wrap: wrap;
  ${FormLabel} {
    width: 100%;
  }
  & svg {
    cursor: pointer;
  }
`;

function ImportedKeyValue(props: { datas: any }) {
  return (
    <>
      {props.datas.map((data: any, index: number) => {
        return (
          <FormRowWithLabel key={index}>
            <FlexContainer>
              <Flex
                className="key-value disabled possible-overflow-key"
                size={1}
              >
                <TooltipComponent
                  content={data.key}
                  hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
                  position="bottom-left"
                >
                  <Text type={TextType.H6}>{data.key}</Text>
                </TooltipComponent>
              </Flex>
              <Flex className="key-value disabled possible-overflow" size={3}>
                <Text type={TextType.H6}>
                  <TooltipComponent
                    content={data.value}
                    hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
                    position="bottom-left"
                  >
                    {data.value}
                  </TooltipComponent>
                </Text>
              </Flex>
            </FlexContainer>
          </FormRowWithLabel>
        );
      })}
    </>
  );
}

const BoundaryContainer = styled.div`
  border: 1px solid transparent;
  border-right: none;
`;

function renderImportedDatasButton(
  dataCount: number,
  onClick: any,
  showInheritedAttributes: boolean,
  attributeName: string,
) {
  return (
    <KeyValueStackContainer>
      <ShowHideImportedHeaders
        onClick={(e) => {
          e.preventDefault();
          onClick(!showInheritedAttributes);
        }}
      >
        <Icon
          className="eye-on-off"
          name={showInheritedAttributes ? "eye-on" : "eye-off"}
          size={IconSize.XXL}
        />
        &nbsp;&nbsp;
        <Text case={Case.CAPITALIZE} type={TextType.P2}>
          {showInheritedAttributes
            ? `Showing inherited ${attributeName}`
            : `${dataCount} ${attributeName}`}
        </Text>
      </ShowHideImportedHeaders>
    </KeyValueStackContainer>
  );
}

function renderHelpSection(
  handleClickLearnHow: any,
  setApiBindHelpSectionVisible: any,
) {
  return (
    <HelpSection>
      <Callout
        closeButton
        fill
        label={
          <CalloutContent>
            <Link
              className="t--learn-how-apis-link"
              onClick={handleClickLearnHow}
            >
              <Text case={Case.UPPERCASE} type={TextType.H6}>
                Learn How
              </Text>
              <Icon name="right-arrow" size={IconSize.XL} />
            </Link>
          </CalloutContent>
        }
        onClose={() => setApiBindHelpSectionVisible(false)}
        text={createMessage(WIDGET_BIND_HELP)}
        variant={Variant.warning}
      />
    </HelpSection>
  );
}

function ImportedDatas(props: { data: any; attributeName: string }) {
  const [showDatas, toggleDatas] = useState(false);
  return (
    <>
      {renderImportedDatasButton(
        props.data.length,
        toggleDatas,
        showDatas,
        props.attributeName,
      )}
      <KeyValueStackContainer>
        <FormRowWithLabel>
          <FlexContainer className="header">
            <Flex className="key-value" size={1}>
              <Text case={Case.CAPITALIZE} type={TextType.H6}>
                Key
              </Text>
            </Flex>
            <Flex className="key-value" size={3}>
              <Text case={Case.CAPITALIZE} type={TextType.H6}>
                Value
              </Text>
            </Flex>
          </FlexContainer>
        </FormRowWithLabel>
        {showDatas && <ImportedKeyValue datas={props.data} />}
      </KeyValueStackContainer>
    </>
  );
}

/**
 * Commons editor form which is being used by API and GraphQL. Since most of the things were common to both so picking out the common part was a better option. For now Body and Pagination component are being passed on by the using component.
 * @param props type CommonFormPropsWithExtraParams
 * @returns Editor with respect to which type is using it
 */
function CommonEditorForm(props: CommonFormPropsWithExtraParams) {
  const [selectedIndex, setSelectedIndex] = useState(
    props.defaultTabSelected || 0,
  );
  const [
    apiBindHelpSectionVisible,
    setApiBindHelpSectionVisible,
  ] = useLocalStorage("apiBindHelpSectionVisible", "true");

  const {
    actionConfigurationHeaders,
    actionConfigurationParams,
    actionName,
    currentActionDatasourceId,
    formName,
    headersCount,
    hintMessages,
    isRunning,
    onRunClick,
    paramsCount,
    pluginId,
    responseDataTypes,
    responseDisplayFormat,
    settingsConfig,
    updateDatasource,
  } = props;
  const dispatch = useDispatch();

  const params = useParams<{ apiId?: string; queryId?: string }>();

  // passing lodash's equality function to ensure that this selector does not cause a rerender multiple times.
  // it checks each value to make sure none has changed before recomputing the actions.
  const actions: Action[] = useSelector(
    (state: AppState) => state.entities.actions.map((action) => action.config),
    equal,
  );
  const currentActionConfig: Action | undefined = actions.find(
    (action) => action.id === params.apiId || action.id === params.queryId,
  );
  const { pageId } = useParams<ExplorerURLParams>();

  const plugin = useSelector((state: AppState) =>
    getPlugin(state, pluginId ?? ""),
  );

  const isGraphql = isGraphqlPlugin(plugin);

  const theme = EditorTheme.LIGHT;
  const handleClickLearnHow = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setGlobalSearchQuery("capturing data"));
    dispatch(toggleShowGlobalSearchModal());
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", { source: "LEARN_HOW_DATASOURCE" });
  };

  return (
    <>
      <CloseEditor />
      <Form onSubmit={props.handleSubmit}>
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
                pageId={pageId}
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
                options={
                  isGraphql ? GRAPHQL_HTTP_METHOD_OPTIONS : HTTP_METHOD_OPTIONS
                }
                placeholder="Method"
                width={"110px"}
              />
            </BoundaryContainer>
            <DatasourceWrapper className="t--dataSourceField">
              <EmbeddedDatasourcePathField
                actionName={actionName}
                codeEditorVisibleOverflow
                formName={formName}
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
            <TabbedViewContainer>
              <TabComponent
                onSelect={setSelectedIndex}
                selectedIndex={selectedIndex}
                tabs={[
                  {
                    key: API_EDITOR_TABS.HEADERS,
                    title: createMessage(API_EDITOR_TAB_TITLES.HEADERS),
                    count: headersCount,
                    panelComponent: (
                      <TabSection>
                        {apiBindHelpSectionVisible &&
                          renderHelpSection(
                            handleClickLearnHow,
                            setApiBindHelpSectionVisible,
                          )}
                        {props.datasourceHeaders.length > 0 && (
                          <ImportedDatas
                            attributeName="headers"
                            data={props.datasourceHeaders}
                          />
                        )}
                        <KeyValueFieldArray
                          actionConfig={actionConfigurationHeaders}
                          dataTreePath={`${actionName}.config.headers`}
                          hideHeader={!!props.datasourceHeaders.length}
                          label="Headers"
                          name="actionConfiguration.headers"
                          placeholder="Value"
                          pushFields
                          theme={theme}
                        />
                      </TabSection>
                    ),
                  },
                  {
                    key: API_EDITOR_TABS.PARAMS,
                    title: createMessage(API_EDITOR_TAB_TITLES.PARAMS),
                    count: paramsCount,
                    panelComponent: (
                      <TabSection>
                        {props.datasourceParams.length > 0 && (
                          <ImportedDatas
                            attributeName={"params"}
                            data={props.datasourceParams}
                          />
                        )}
                        <KeyValueFieldArray
                          actionConfig={actionConfigurationParams}
                          dataTreePath={`${actionName}.config.queryParameters`}
                          hideHeader={!!props.datasourceParams.length}
                          label="Params"
                          name="actionConfiguration.queryParameters"
                          pushFields
                          theme={theme}
                        />
                      </TabSection>
                    ),
                  },
                  {
                    key: API_EDITOR_TABS.BODY,
                    title: createMessage(API_EDITOR_TAB_TITLES.BODY),
                    panelComponent: props.bodyUIComponent,
                  },
                  {
                    key: API_EDITOR_TABS.PAGINATION,
                    title: createMessage(API_EDITOR_TAB_TITLES.PAGINATION),
                    panelComponent: props.paginationUIComponent,
                  },
                  {
                    key: API_EDITOR_TABS.AUTHENTICATION,
                    title: createMessage(API_EDITOR_TAB_TITLES.AUTHENTICATION),
                    panelComponent: <ApiAuthentication formName={formName} />,
                  },
                  {
                    key: API_EDITOR_TABS.SETTINGS,
                    title: createMessage(API_EDITOR_TAB_TITLES.SETTINGS),
                    panelComponent: (
                      <SettingsWrapper>
                        <ActionSettings
                          actionSettingsConfig={settingsConfig}
                          formName={formName}
                          theme={theme}
                        />
                      </SettingsWrapper>
                    ),
                  },
                ]}
              />
            </TabbedViewContainer>
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

export default CommonEditorForm;
