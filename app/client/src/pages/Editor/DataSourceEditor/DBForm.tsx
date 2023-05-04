import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import _ from "lodash";
import { DATASOURCE_DB_FORM } from "@appsmith/constants/forms";
import { Icon } from "@blueprintjs/core";
import { Callout, Variant } from "design-system-old";
import CollapsibleHelp from "components/designSystems/appsmith/help/CollapsibleHelp";
import type { Datasource } from "entities/Datasource";
import type { InjectedFormProps } from "redux-form";
import { reduxForm } from "redux-form";
import { APPSMITH_IP_ADDRESSES } from "constants/DatasourceEditorConstants";
import { getAppsmithConfigs } from "@appsmith/configs";
import { convertArrayToSentence } from "utils/helpers";
import { PluginType } from "entities/Action";
import type { AppState } from "@appsmith/reducers";
import type { JSONtoFormProps } from "./JSONtoForm";
import { JSONtoForm } from "./JSONtoForm";
import DatasourceAuth from "pages/common/datasourceAuth";
import { getDatasourceFormButtonConfig } from "selectors/entitiesSelector";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import Debugger, {
  ResizerContentContainer,
  ResizerMainContainer,
} from "./Debugger";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import DatasourceInformation from "./DatasourceSection";
import { DocsLink, openDoc } from "../../../constants/DocumentationLinks";
import { selectFeatureFlags } from "selectors/usersSelectors";

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
}

type Props = DatasourceDBEditorProps &
  InjectedFormProps<Datasource, DatasourceDBEditorProps>;

const StyledOpenDocsIcon = styled(Icon)`
  svg {
    width: 12px;
    height: 18px;
  }
`;

const CalloutWrapper = styled.div`
  padding: 0 20px;
`;

const CollapsibleWrapper = styled.div`
  width: max-content;
  padding: 0 20px;
`;

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
  border-bottom: 1px solid #d0d7dd;
  padding: 24px 20px;
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

    return this.renderDataSourceConfigForm(formConfig);
  }

  renderDataSourceConfigForm = (sections: any) => {
    const {
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

    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <ResizerMainContainer>
          <ResizerContentContainer className="db-form-resizer-content">
            {messages &&
              messages.map((msg, i) => (
                <CalloutWrapper key={i}>
                  <Callout
                    addMarginTop
                    fill
                    text={msg}
                    variant={Variant.warning}
                  />
                </CalloutWrapper>
              ))}
            {!this.props.hiddenHeader &&
              cloudHosting &&
              pluginType === PluginType.DB &&
              !viewMode && (
                <CollapsibleWrapper>
                  <CollapsibleHelp>
                    <span>{`Whitelist the IP ${convertArrayToSentence(
                      APPSMITH_IP_ADDRESSES,
                    )}  on your database instance to connect to it. `}</span>
                    <a onClick={this.openDocumentation}>
                      {"Learn more "}
                      <StyledOpenDocsIcon icon="document-open" />
                    </a>
                  </CollapsibleHelp>
                </CollapsibleWrapper>
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
                {!_.isNil(formConfig) && !_.isNil(datasource) ? (
                  <DatasourceInformation
                    config={formConfig[0]}
                    datasource={datasource}
                    viewMode={viewMode}
                  />
                ) : undefined}
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
                isInvalid={this.validate()}
                shouldRender={!viewMode}
                triggerSave={this.props.isDatasourceBeingSavedFromPopup}
              />
            )}
          </ResizerContentContainer>
          {showDebugger && <Debugger />}
        </ResizerMainContainer>
      </Form>
    );
  };
}

const mapStateToProps = (state: AppState, props: any) => {
  const datasource = state.entities.datasources.list.find(
    (e) => e.id === props.datasourceId,
  ) as Datasource;

  const hintMessages = datasource && datasource.messages;

  // Debugger render flag
  const showDebugger = showDebuggerFlag(state);

  const datasourceButtonConfiguration = getDatasourceFormButtonConfig(
    state,
    props?.formData?.pluginId,
  );

  return {
    messages: hintMessages,
    datasource,
    datasourceButtonConfiguration,
    isReconnectingModalOpen: state.entities.datasources.isReconnectingModalOpen,
    datasourceName: datasource?.name ?? "",
    featureFlags: selectFeatureFlags(state),
    isDatasourceBeingSavedFromPopup:
      state.entities.datasources.isDatasourceBeingSavedFromPopup,
    showDebugger,
  };
};

export default connect(mapStateToProps)(
  reduxForm<Datasource, DatasourceDBEditorProps>({
    form: DATASOURCE_DB_FORM,
    enableReinitialize: true,
  })(DatasourceDBEditor),
);
