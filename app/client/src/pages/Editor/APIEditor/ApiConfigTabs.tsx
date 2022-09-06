import React, { useCallback, useState } from "react";
import { TabComponent } from "components/ads/Tabs";
import { API_EDITOR_TABS } from "constants/ApiEditorConstants";
import {
  API_EDITOR_TAB_TITLES,
  API_PANE_NO_BODY,
  createMessage,
  WIDGET_BIND_HELP,
} from "ce/constants/messages";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import PostBodyData from "pages/Editor/APIEditor/PostBodyData";
import {
  Case,
  Icon,
  IconSize,
  Text,
  TextType,
  TooltipComponent,
} from "design-system";
import Pagination from "pages/Editor/APIEditor/Pagination";
import ApiAuthentication from "pages/Editor/APIEditor/ApiAuthentication";
import ActionSettings from "pages/Editor/ActionSettings";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import {
  HelpSection,
  ShowHideImportedHeaders,
  TabbedViewContainer,
} from "pages/Editor/APIEditor/Form";
import { useDispatch, useSelector } from "react-redux";
import { getApiPaneConfigSelectedTabIndex } from "selectors/apiPaneSelectors";
import { setApiPaneConfigSelectedTabIndex } from "actions/apiPaneActions";
import styled from "styled-components";
import { useLocalStorage } from "utils/hooks/localstorage";
import Callout from "components/ads/Callout";
import { Classes, Variant } from "components/ads";
import FormLabel from "components/editorComponents/FormLabel";
import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import FormRow from "components/editorComponents/FormRow";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { Classes as BluePrintClasses } from "@blueprintjs/core/lib/esm/common";
import { formValueSelector } from "redux-form";
import { AppState } from "ce/reducers";
import get from "lodash/get";
import { getApiName } from "selectors/formSelectors";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { PaginationType } from "entities/Action";
import { FormSettingsConfigs } from "utils/DynamicBindingUtils";

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

const SettingsWrapper = styled.div`
  padding: 16px 30px;
  height: 100%;
  ${FormLabel} {
    padding: 0px;
  }
`;

const NoBodyMessage = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;

  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.apiPane.body.text};
  }
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

const selector = formValueSelector(API_EDITOR_FORM_NAME);

type Props = {
  theme: EditorTheme;
  onRunClick: () => void;
  paginationType: PaginationType;
  settingsConfig: FormSettingsConfigs;
};

const ApiConfigTabs = (props: Props) => {
  const { theme } = props;
  const dispatch = useDispatch();
  const selectedIndex = useSelector(getApiPaneConfigSelectedTabIndex);
  const setSelectedIndex = useCallback(
    (index: number) => dispatch(setApiPaneConfigSelectedTabIndex(index)),
    [],
  );
  const [
    apiBindHelpSectionVisible,
    setApiBindHelpSectionVisible,
  ] = useLocalStorage("apiBindHelpSectionVisible", "true");
  const handleClickLearnHow = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setGlobalSearchQuery("capturing data"));
    dispatch(toggleShowGlobalSearchModal());
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", { source: "LEARN_HOW_DATASOURCE" });
  };

  const datasources = useSelector(
    (state: AppState) => state.entities.datasources,
  );
  let datasourceFromAction = useSelector((state: AppState) =>
    selector(state, "datasource"),
  );
  if (datasourceFromAction && datasourceFromAction.hasOwnProperty("id")) {
    datasourceFromAction = datasources.list.find(
      (d) => d.id === datasourceFromAction.id,
    );
  }

  const datasourceHeaders =
    get(datasourceFromAction, "datasourceConfiguration.headers") || [];
  const datasourceParams =
    get(datasourceFromAction, "datasourceConfiguration.queryParameters") || [];

  const headers = useSelector((state: AppState) =>
    selector(state, "actionConfiguration.headers"),
  );
  let headersCount = 0;

  if (Array.isArray(headers)) {
    const validHeaders = headers.filter(
      (value) => value.key && value.key !== "",
    );
    headersCount += validHeaders.length;
  }

  if (Array.isArray(datasourceHeaders)) {
    const validHeaders = datasourceHeaders.filter(
      (value: any) => value.key && value.key !== "",
    );
    headersCount += validHeaders.length;
  }

  const params = useSelector((state: AppState) =>
    selector(state, "actionConfiguration.queryParameters"),
  );
  let paramsCount = 0;

  if (Array.isArray(params)) {
    const validParams = params.filter((value) => value.key && value.key !== "");
    paramsCount = validParams.length;
  }

  if (Array.isArray(datasourceParams)) {
    const validParams = datasourceParams.filter(
      (value: any) => value.key && value.key !== "",
    );
    paramsCount += validParams.length;
  }

  const actionConfigurationHeaders =
    useSelector((state: AppState) =>
      selector(state, "actionConfiguration.headers"),
    ) || [];
  const actionConfigurationParams =
    useSelector((state: AppState) =>
      selector(state, "actionConfiguration.queryParameters"),
    ) || [];

  const apiId = useSelector((state: AppState) => selector(state, "id"));

  const actionName =
    useSelector((state: AppState) => getApiName(state, apiId)) || "";

  const httpMethodFromForm = useSelector((state: AppState) =>
    selector(state, "actionConfiguration.httpMethod"),
  );

  return (
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
                {datasourceHeaders.length > 0 && (
                  <ImportedDatas
                    attributeName="headers"
                    data={datasourceHeaders}
                  />
                )}
                <KeyValueFieldArray
                  actionConfig={actionConfigurationHeaders}
                  dataTreePath={`${actionName}.config.headers`}
                  hideHeader={!!datasourceHeaders.length}
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
                {datasourceParams.length > 0 && (
                  <ImportedDatas
                    attributeName={"params"}
                    data={datasourceParams}
                  />
                )}
                <KeyValueFieldArray
                  actionConfig={actionConfigurationParams}
                  dataTreePath={`${actionName}.config.queryParameters`}
                  hideHeader={!!datasourceParams.length}
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
            panelComponent: httpMethodFromForm ? (
              <PostBodyData
                dataTreePath={`${actionName}.config`}
                theme={theme}
              />
            ) : (
              <NoBodyMessage>
                <Text type={TextType.P2}>
                  {createMessage(API_PANE_NO_BODY)}
                </Text>
              </NoBodyMessage>
            ),
          },
          {
            key: API_EDITOR_TABS.PAGINATION,
            title: createMessage(API_EDITOR_TAB_TITLES.PAGINATION),
            panelComponent: (
              <Pagination
                onTestClick={props.onRunClick}
                paginationType={props.paginationType}
                theme={theme}
              />
            ),
          },
          {
            key: API_EDITOR_TABS.AUTHENTICATION,
            title: createMessage(API_EDITOR_TAB_TITLES.AUTHENTICATION),
            panelComponent: <ApiAuthentication />,
          },
          {
            key: API_EDITOR_TABS.SETTINGS,
            title: createMessage(API_EDITOR_TAB_TITLES.SETTINGS),
            panelComponent: (
              <SettingsWrapper>
                <ActionSettings
                  actionSettingsConfig={props.settingsConfig}
                  formName={API_EDITOR_FORM_NAME}
                  theme={theme}
                />
              </SettingsWrapper>
            ),
          },
        ]}
      />
    </TabbedViewContainer>
  );
};

export default ApiConfigTabs;
