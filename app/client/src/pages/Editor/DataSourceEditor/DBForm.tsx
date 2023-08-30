import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import _ from "lodash";
import { DATASOURCE_DB_FORM } from "@appsmith/constants/forms";
import type { Datasource } from "entities/Datasource";
import type { InjectedFormProps } from "redux-form";
import { reduxForm } from "redux-form";
import {
  APPSMITH_IP_ADDRESSES,
  VIEW_MODE_TABS,
} from "constants/DatasourceEditorConstants";
import { getAppsmithConfigs } from "@appsmith/configs";
import { convertArrayToSentence } from "utils/helpers";
import { PluginType } from "entities/Action";
import type { AppState } from "@appsmith/reducers";
import type { JSONtoFormProps } from "./JSONtoForm";
import { JSONtoForm } from "./JSONtoForm";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import DatasourceInformation from "./DatasourceSection";
import { DocsLink, openDoc } from "../../../constants/DocumentationLinks";
import { Callout, Tabs, Tab, TabsList, TabPanel } from "design-system";
import DatasourceViewModeSchema from "./DatasourceViewModeSchema";
import {
  DATASOURCE_CONFIGURATIONS_TAB,
  DATASOURCE_VIEW_DATA_TAB,
  createMessage,
} from "@appsmith/constants/messages";
import { isEnvironmentValid } from "@appsmith/utils/Environments";
import { setDatasourceViewModeFlag } from "actions/datasourceActions";

const { cloudHosting } = getAppsmithConfigs();

interface DatasourceDBEditorProps extends JSONtoFormProps {
  datasourceId: string;
  applicationId: string;
  pageId: string;
  viewMode: boolean;
  pluginType: string;
  messages?: Array<string>;
  datasource: Datasource;
  hiddenHeader?: boolean;
  datasourceName?: string;
  showFilterComponent: boolean;
  isEnabledForDSViewModeSchema: boolean;
  isDatasourceValid: boolean;
  isPluginAllowedToPreviewData: boolean;
  setDatasourceViewModeFlag: (viewMode: boolean) => void;
}

type Props = DatasourceDBEditorProps &
  InjectedFormProps<Datasource, DatasourceDBEditorProps>;

export const Form = styled.form<{
  showFilterComponent: boolean;
  viewMode: boolean;
}>`
  display: flex;
  flex-direction: column;
  ${(props) =>
    !props.viewMode && `height: ${`calc(100% - ${props?.theme.backBanner})`};`}
  overflow-y: scroll;
  padding-bottom: 20px;
  margin-left: ${(props) => (props.showFilterComponent ? "24px" : "0px")};
`;

export const ViewModeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--ads-v2-color-border);
  padding: var(--ads-v2-spaces-7) 0;
  gap: var(--ads-v2-spaces-4);
`;

export const TabsContainer = styled(Tabs)`
  height: 100%;
`;

export const TabPanelContainer = styled(TabPanel)`
  height: 95%;
`;

export const ConfigurationTabPanelContainer = styled(TabPanel)`
  margin-top: 0px;
`;

class DatasourceDBEditor extends JSONtoForm<Props> {
  openDocumentation = () => {
    openDoc(DocsLink.WHITELIST_IP);
  };

  render() {
    const { formConfig, viewMode } = this.props;

    // make sure this redux form has been initialized before rendering anything.
    // the initialized prop below comes from redux-form.
    // The viewMode condition is added to allow the conditons only run on the editMode
    if (!this.props.initialized && !viewMode) {
      return null;
    }

    return this.renderDataSourceConfigForm(formConfig);
  }
  renderDataSourceConfigForm = (sections: any) => {
    const {
      datasource,
      datasourceId,
      formConfig,
      messages,
      pluginType,
      showFilterComponent,
      viewMode,
    } = this.props;

    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        showFilterComponent={showFilterComponent}
        viewMode={viewMode}
      >
        {messages &&
          messages.map((msg, i) => {
            return (
              <Callout className="mt-4" key={i} kind="warning">
                {msg}
              </Callout>
            );
          })}
        {!this.props.hiddenHeader &&
          cloudHosting &&
          pluginType === PluginType.DB &&
          !viewMode && (
            <Callout
              className="mt-4"
              kind="warning"
              links={[
                {
                  children: "Learn more",
                  onClick: this.openDocumentation,
                  endIcon: "share-box-line",
                  to: "about:blank",
                },
              ]}
            >
              {`Whitelist the IP ${convertArrayToSentence(
                APPSMITH_IP_ADDRESSES,
              )}  on your database instance to connect to it. `}
            </Callout>
          )}
        {(!viewMode || datasourceId === TEMP_DATASOURCE_ID) && (
          <>
            {!_.isNil(sections)
              ? _.map(sections, this.renderMainSection)
              : undefined}
            {""}
          </>
        )}
        {viewMode && (
          <>
            {this.props.isEnabledForDSViewModeSchema &&
              this.props.isPluginAllowedToPreviewData && (
                <TabsContainer
                  defaultValue={
                    this.props.isDatasourceValid
                      ? VIEW_MODE_TABS.VIEW_DATA
                      : VIEW_MODE_TABS.CONFIGURATIONS
                  }
                >
                  <TabsList>
                    <Tab value={VIEW_MODE_TABS.VIEW_DATA}>
                      {createMessage(DATASOURCE_VIEW_DATA_TAB)}
                    </Tab>
                    <Tab value={VIEW_MODE_TABS.CONFIGURATIONS}>
                      {createMessage(DATASOURCE_CONFIGURATIONS_TAB)}
                    </Tab>
                  </TabsList>
                  <TabPanelContainer value={VIEW_MODE_TABS.VIEW_DATA}>
                    <DatasourceViewModeSchema
                      datasource={datasource}
                      datasourceId={datasourceId}
                      setDatasourceViewModeFlag={
                        this.props.setDatasourceViewModeFlag
                      }
                    />
                  </TabPanelContainer>
                  <ConfigurationTabPanelContainer
                    value={VIEW_MODE_TABS.CONFIGURATIONS}
                  >
                    <ViewModeWrapper data-testid="t--ds-review-section">
                      {!_.isNil(formConfig) && !_.isNil(datasource) ? (
                        <DatasourceInformation
                          config={formConfig[0]}
                          datasource={datasource}
                          viewMode={viewMode}
                        />
                      ) : undefined}
                    </ViewModeWrapper>
                  </ConfigurationTabPanelContainer>
                </TabsContainer>
              )}
            {(!this.props.isEnabledForDSViewModeSchema ||
              !this.props.isPluginAllowedToPreviewData) && (
              <ViewModeWrapper data-testid="t--ds-review-section">
                {!_.isNil(formConfig) && !_.isNil(datasource) ? (
                  <DatasourceInformation
                    config={formConfig[0]}
                    datasource={datasource}
                    viewMode={viewMode}
                  />
                ) : undefined}
              </ViewModeWrapper>
            )}
          </>
        )}
      </Form>
    );
  };
}

const mapStateToProps = (state: AppState, props: any) => {
  const datasource = state.entities.datasources.list.find(
    (e) => e.id === props.datasourceId,
  ) as Datasource;

  const hintMessages = datasource && datasource.messages;

  const isDatasourceValid = isEnvironmentValid(datasource) || false;

  return {
    messages: hintMessages,
    datasource,
    datasourceName: datasource?.name ?? "",
    isDatasourceValid,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  setDatasourceViewModeFlag: (viewMode: boolean) =>
    dispatch(setDatasourceViewModeFlag(viewMode)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  reduxForm<Datasource, DatasourceDBEditorProps>({
    form: DATASOURCE_DB_FORM,
    enableReinitialize: true,
  })(DatasourceDBEditor),
);
