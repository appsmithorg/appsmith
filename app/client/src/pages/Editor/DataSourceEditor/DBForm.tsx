import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import _ from "lodash";
import { DATASOURCE_DB_FORM } from "@appsmith/constants/forms";
import FormTitle from "./FormTitle";
import Connected from "./Connected";
import type { Datasource } from "entities/Datasource";
import type { InjectedFormProps } from "redux-form";
import { reduxForm } from "redux-form";
import { APPSMITH_IP_ADDRESSES } from "constants/DatasourceEditorConstants";
import { getAppsmithConfigs } from "@appsmith/configs";
import { convertArrayToSentence } from "utils/helpers";
import { PluginType } from "entities/Action";
import type { AppState } from "@appsmith/reducers";
import type { JSONtoFormProps } from "./JSONtoForm";
import {
  FormTitleContainer,
  Header,
  JSONtoForm,
  PluginImage,
} from "./JSONtoForm";
import DatasourceAuth from "pages/common/datasourceAuth";
import {
  getDatasourceFormButtonConfig,
  getPlugin,
} from "selectors/entitiesSelector";
import { hasManageDatasourcePermission } from "@appsmith/utils/permissionHelpers";
import {
  DatasourceEditEntryPoints,
  TEMP_DATASOURCE_ID,
} from "constants/Datasource";
import Debugger, {
  ResizerContentContainer,
  ResizerMainContainer,
} from "./Debugger";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { Button, Callout } from "design-system";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import DatasourceInformation from "./DatasourceSection";
import { DocsLink, openDoc } from "../../../constants/DocumentationLinks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { Plugin } from "api/PluginApi";

const { cloudHosting } = getAppsmithConfigs();

interface DatasourceDBEditorProps extends JSONtoFormProps {
  setDatasourceViewMode: (viewMode: boolean) => void;
  datasourceId: string;
  applicationId: string;
  pageId: string;
  isNewDatasource: boolean;
  pluginImage: string;
  viewMode: boolean;
  pluginType: string;
  messages?: Array<string>;
  datasource: Datasource;
  datasourceButtonConfiguration: string[] | undefined;
  hiddenHeader?: boolean;
  canManageDatasource?: boolean;
  datasourceName?: string;
  showDebugger: boolean;
  isDatasourceBeingSavedFromPopup: boolean;
  isFormDirty: boolean;
  datasourceDeleteTrigger: () => void;
  // isInsideReconnectModal: indicates that the datasource form is rendering inside reconnect modal
  isInsideReconnectModal?: boolean;
  plugin?: Plugin | undefined;
}

type Props = DatasourceDBEditorProps &
  InjectedFormProps<Datasource, DatasourceDBEditorProps>;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  height: ${({ theme }) => `calc(100% - ${theme.backBanner})`};
  overflow: hidden;
  flex: 1;
`;

const ViewModeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--ads-v2-color-border);
  padding: var(--ads-v2-spaces-7) 0;
`;

class DatasourceDBEditor extends JSONtoForm<Props> {
  componentDidUpdate(prevProps: Props) {
    if (prevProps.datasourceId !== this.props.datasourceId) {
      super.componentDidUpdate(prevProps);
    }
  }
  // returns normalized and trimmed datasource form data
  getSanitizedData = () => {
    return this.getTrimmedData({
      ...this.normalizeValues(),
      name: this.props.datasourceName,
    });
  };

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

    const content = this.renderDataSourceConfigForm(formConfig);
    return this.renderForm(content);
  }
  renderDataSourceConfigForm = (sections: any) => {
    const {
      canManageDatasource,
      datasource,
      datasourceButtonConfiguration,
      datasourceDeleteTrigger,
      datasourceId,
      formConfig,
      formData,
      messages,
      pluginType,
      showDebugger,
      viewMode,
    } = this.props;

    const createFlow = datasourceId === TEMP_DATASOURCE_ID;
    return (
      <>
        {!this.props.hiddenHeader && (
          <Header>
            <FormTitleContainer>
              <PluginImage
                alt="Datasource"
                src={getAssetUrl(this.props.pluginImage)}
              />
              <FormTitle
                disabled={!createFlow && !canManageDatasource}
                focusOnMount={this.props.isNewDatasource}
              />
            </FormTitleContainer>
            {viewMode && (
              <Button
                className="t--edit-datasource"
                kind="secondary"
                onClick={() => {
                  this.props.setDatasourceViewMode(false);
                  // TODO: Need to add these changes in DatasourceEditor/index.tsx, as
                  // We are combining common changes of REST and DB Plugins in index.tsx file
                  AnalyticsUtil.logEvent("EDIT_DATASOURCE_CLICK", {
                    datasourceId: datasourceId,
                    pluginName: this.props?.plugin?.name,
                    entryPoint: DatasourceEditEntryPoints.DATASOURCE_FORM_EDIT,
                  });
                }}
                size="md"
              >
                Edit
              </Button>
            )}
          </Header>
        )}
        <ResizerMainContainer>
          <ResizerContentContainer className="db-form-resizer-content">
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
              <ViewModeWrapper>
                <Connected />
                <div style={{ marginTop: "30px" }}>
                  {!_.isNil(formConfig) && !_.isNil(datasource) ? (
                    <DatasourceInformation
                      config={formConfig[0]}
                      datasource={datasource}
                      viewMode={viewMode}
                    />
                  ) : undefined}
                </div>
              </ViewModeWrapper>
            )}
            {/* Render datasource form call-to-actions */}
            {datasource && (
              <DatasourceAuth
                datasource={datasource}
                datasourceButtonConfiguration={datasourceButtonConfiguration}
                datasourceDeleteTrigger={datasourceDeleteTrigger}
                formData={formData}
                getSanitizedFormData={_.memoize(this.getSanitizedData)}
                isFormDirty={this.props.isFormDirty}
                isInsideReconnectModal={this.props.isInsideReconnectModal}
                isInvalid={this.validate()}
                shouldRender={!viewMode}
                triggerSave={this.props.isDatasourceBeingSavedFromPopup}
              />
            )}
          </ResizerContentContainer>
          {showDebugger && <Debugger />}
        </ResizerMainContainer>
      </>
    );
  };
}

const mapStateToProps = (state: AppState, props: any) => {
  const datasource = state.entities.datasources.list.find(
    (e) => e.id === props.datasourceId,
  ) as Datasource;

  // TODO: Need to add these changes in DatasourceEditor/index.tsx, as
  // We are combining common changes of REST and DB Plugins in index.tsx file
  const pluginId = _.get(datasource, "pluginId", "");
  const plugin = getPlugin(state, pluginId);

  const hintMessages = datasource && datasource.messages;

  // Debugger render flag
  const showDebugger = showDebuggerFlag(state);

  const datasourceButtonConfiguration = getDatasourceFormButtonConfig(
    state,
    props?.formData?.pluginId,
  );

  const datasourcePermissions = datasource.userPermissions || [];

  const canManageDatasource = hasManageDatasourcePermission(
    datasourcePermissions,
  );

  return {
    messages: hintMessages,
    datasource,
    datasourceButtonConfiguration,
    isReconnectingModalOpen: state.entities.datasources.isReconnectingModalOpen,
    canManageDatasource: canManageDatasource,
    datasourceName: datasource?.name ?? "",
    isDatasourceBeingSavedFromPopup:
      state.entities.datasources.isDatasourceBeingSavedFromPopup,
    showDebugger,
    plugin,
  };
};

export default connect(mapStateToProps)(
  reduxForm<Datasource, DatasourceDBEditorProps>({
    form: DATASOURCE_DB_FORM,
    enableReinitialize: true,
  })(DatasourceDBEditor),
);
