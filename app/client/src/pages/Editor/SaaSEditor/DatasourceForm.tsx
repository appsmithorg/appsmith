import React from "react";
import styled from "styled-components";
import { get, isEqual, isNil, map, memoize, omit } from "lodash";
import { DATASOURCE_SAAS_FORM } from "ee/constants/forms";
import type { Datasource } from "entities/Datasource";
import { AuthenticationStatus } from "entities/Datasource";
import { ActionType } from "entities/Datasource";
import type { InjectedFormProps } from "redux-form";
import {
  getFormValues,
  isDirty,
  reduxForm,
  initialize,
  getFormInitialValues,
  reset,
} from "redux-form";
import type { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import type { AppState } from "ee/reducers";
import {
  getDatasource,
  getPluginImages,
  getDatasourceFormButtonConfig,
  getPlugin,
  getPluginDocumentationLinks,
  getDatasourceScopeValue,
} from "ee/selectors/entitiesSelector";
import type { ActionDataState } from "ee/reducers/entityReducers/actionsReducer";
import type { JSONtoFormProps } from "../DataSourceEditor/JSONtoForm";
import { JSONtoForm } from "../DataSourceEditor/JSONtoForm";
import { normalizeValues, validate } from "components/formControls/utils";
import {
  getCurrentApplicationId,
  getGsheetProjectID,
  getGsheetToken,
} from "selectors/editorSelectors";
import DatasourceAuth from "pages/common/datasourceAuth";
import EntityNotFoundPane from "../EntityNotFoundPane";
import {
  isDatasourceAuthorizedForQueryCreation,
  isEnabledForPreviewData,
  isGoogleSheetPluginDS,
} from "utils/editorContextUtils";
import type { PluginType, Plugin } from "entities/Plugin";
import AuthMessage from "pages/common/datasourceAuth/AuthMessage";
import { isDatasourceInViewMode } from "selectors/ui";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import {
  createTempDatasourceFromForm,
  deleteTempDSFromDraft,
  loadFilePickerAction,
  removeTempDatasource,
  setDatasourceViewMode,
  toggleSaveActionFlag,
  toggleSaveActionFromPopupFlag,
  datasourceDiscardAction,
} from "actions/datasourceActions";
import SaveOrDiscardDatasourceModal from "../DataSourceEditor/SaveOrDiscardDatasourceModal";
import {
  createMessage,
  GOOGLE_SHEETS_INFO_BANNER_MESSAGE,
  GSHEET_AUTHORIZATION_ERROR,
  SAVE_AND_AUTHORIZE_BUTTON_TEXT,
} from "ee/constants/messages";
import { getDatasourceErrorMessage } from "./errorUtils";
import GoogleSheetFilePicker from "./GoogleSheetFilePicker";
import DatasourceInformation, {
  ViewModeWrapper,
} from "./../DataSourceEditor/DatasourceSection";
import type { ControlProps } from "components/formControls/BaseControl";
import { DSFormHeader } from "../DataSourceEditor/DSFormHeader";
import Debugger, {
  ResizerContentContainer,
  ResizerMainContainer,
} from "../DataSourceEditor/Debugger";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import { Form } from "../DataSourceEditor/DBForm";
import DSDataFilter from "ee/components/DSDataFilter";
import { DSEditorWrapper } from "../DataSourceEditor";
import type { DatasourceFilterState } from "../DataSourceEditor";
import { getQueryParams } from "utils/URLUtils";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getDefaultEnvironmentId } from "ee/selectors/environmentSelectors";
import { DEFAULT_ENV_ID } from "ee/api/ApiUtils";
import {
  getHasDeleteDatasourcePermission,
  getHasManageDatasourcePermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import {
  selectFeatureFlagCheck,
  selectFeatureFlags,
} from "ee/selectors/featureFlagsSelectors";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import DatasourceTabs from "../DatasourceInfo/DatasorceTabs";
import { getCurrentApplicationIdForCreateNewApp } from "ee/selectors/applicationSelectors";
import { convertToPageIdSelector } from "selectors/pageListSelectors";

const ViewModeContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

interface StateProps extends JSONtoFormProps {
  applicationId: string;
  canManageDatasource?: boolean;
  canDeleteDatasource?: boolean;
  isSaving: boolean;
  isTesting: boolean;
  isDeleting: boolean;
  loadingFormConfigs: boolean;
  isNewDatasource: boolean;
  pluginImage: string;
  plugin?: Plugin;
  pluginId: string;
  actions: ActionDataState;
  datasource?: Datasource;
  datasourceButtonConfiguration: string[] | undefined;
  pageId?: string; // for reconnect modal
  pluginPackageName: string; // for reconnect modal
  datasourceName: string;
  viewMode: boolean;
  isDatasourceBeingSaved: boolean;
  isDatasourceBeingSavedFromPopup: boolean;
  isFormDirty: boolean;
  isPluginAuthorized: boolean;
  gsheetToken?: string;
  gsheetProjectID?: string;
  showDebugger: boolean;
  scopeValue?: string;
  requiredFields: Record<string, ControlProps>;
  configDetails: Record<string, string>;
  isPluginAuthFailed: boolean;
  isPluginAllowedToPreviewData: boolean;
}
interface DatasourceFormFunctions {
  discardTempDatasource: () => void;
  deleteTempDSFromDraft: () => void;
  toggleSaveActionFlag: (flag: boolean) => void;
  toggleSaveActionFromPopupFlag: (flag: boolean) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createTempDatasource: (data: any) => void;
  setDatasourceViewMode: (payload: {
    datasourceId: string;
    viewMode: boolean;
  }) => void;
  loadFilePickerAction: () => void;
  datasourceDiscardAction: (pluginId: string) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initializeDatasource: (values: any) => void;
  resetForm: (formName: string) => void;
}

type DatasourceSaaSEditorProps = StateProps &
  DatasourceFormFunctions &
  SaasEditorWrappperProps &
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RouteComponentProps<RouteProps> & { dispatch: any };

type Props = DatasourceSaaSEditorProps &
  InjectedFormProps<Datasource, DatasourceSaaSEditorProps>;

/*
  **** State Variables Description ****
  showDialog: flag used to show/hide the datasource discard popup
  routesBlocked: flag used to identity if routes are blocked or not
  unblock: on blocking routes using history.block, it returns a function which can be used to unblock the routes
  navigation: function that navigates to path that we want to transition to, after discard action on datasource discard dialog popup
*/
interface State {
  showDialog: boolean;
  routesBlocked: boolean;
  readUrlParams: boolean;
  filterParams: DatasourceFilterState;
  unblock(): void;
  navigation(): void;
}

interface SaasEditorWrappperProps {
  hiddenHeader?: boolean; // for reconnect modal
  isInsideReconnectModal?: boolean; // for reconnect modal
  currentEnvironment: string;
  isOnboardingFlow?: boolean;
  datasourceId: string;
  pageId: string;
  pluginPackageName: string;
}
interface RouteProps {
  datasourceId: string;
  basePageId: string;
  pluginPackageName: string;
}

interface SaasEditorWrappperState {
  requiredFields: Record<string, ControlProps>;
  configDetails: Record<string, string>;
}
class SaasEditorWrapper extends React.Component<
  SaasEditorWrappperProps,
  SaasEditorWrappperState
> {
  constructor(props: SaasEditorWrappperProps) {
    super(props);
    this.state = {
      requiredFields: {},
      configDetails: {},
    };
  }

  componentDidUpdate(prevProps: Readonly<SaasEditorWrappperProps>): void {
    // if the datasource id changes, we need to reset the required fields and configDetails
    if (this.props.datasourceId !== prevProps.datasourceId) {
      this.setState({
        requiredFields: {},
        configDetails: {},
      });
    }
  }

  // updates the configDetails and requiredFields objects in the state
  setupConfig = (config: ControlProps) => {
    const { configProperty, controlType, isRequired } = config;
    const configDetails = this.state.configDetails;
    const requiredFields = this.state.requiredFields;

    configDetails[configProperty] = controlType;

    if (isRequired) requiredFields[configProperty] = config;

    this.setState({
      configDetails,
      requiredFields,
    });
  };

  render() {
    return (
      <SaaSEditor
        {...this.props}
        configDetails={this.state.configDetails}
        requiredFields={this.state.requiredFields}
        setupConfig={this.setupConfig}
      />
    );
  }
}

class DatasourceSaaSEditor extends JSONtoForm<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showDialog: false,
      routesBlocked: false,
      readUrlParams: false,
      filterParams: {
        id: DEFAULT_ENV_ID,
        name: "",
        userPermissions: [],
      },
      unblock: () => {
        return undefined;
      },
      navigation: () => {
        return undefined;
      },
    };
    this.closeDialog = this.closeDialog.bind(this);
    this.updateFilter = this.updateFilter.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onDiscard = this.onDiscard.bind(this);
    this.datasourceDeleteTrigger = this.datasourceDeleteTrigger.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    const urlObject = new URL(window?.location?.href);
    const pluginId = urlObject?.searchParams?.get("pluginId");
    // update block state when form becomes dirty/view mode is switched on

    // if the datasource configurations (except the name) has changed, we reinitialize the form.
    // this is to allow for cases when the datasource has been authorized
    if (
      !isEqual(
        omit(this.props.datasource, "name"),
        omit(prevProps.datasource, "name"),
      )
    ) {
      this.props.initializeDatasource(omit(this.props.datasource, "name"));
    }

    if (
      prevProps.viewMode !== this.props.viewMode &&
      !this.props.viewMode &&
      !!pluginId
    ) {
      this.blockRoutes();
    }

    if (!this.props.isOnboardingFlow) {
      this.setViewModeFromQueryParams();
    }

    // When save button is clicked in DS form, routes should be unblocked
    if (this.props.isDatasourceBeingSaved) {
      this.closeDialogAndUnblockRoutes();
    }
  }

  // To move to edit state for new datasources and when we want to move to edit state
  // from outside the datasource route
  setViewModeFromQueryParams() {
    const params = getQueryParams();

    if (this.props.viewMode) {
      if (
        (params.viewMode === "false" && !this.state.readUrlParams) ||
        this.props.isNewDatasource
      ) {
        // We just want to read the query params once. Cannot remove query params
        // here as this triggers history.block
        this.setState(
          {
            readUrlParams: true,
          },
          () => {
            this.props.setDatasourceViewMode({
              datasourceId: this.props.datasourceId,
              viewMode: false,
            });
          },
        );
      }
    }
  }

  routesBlockFormChangeCallback() {
    if (this.props.isFormDirty) {
      if (!this.state.routesBlocked) {
        this.blockRoutes();
      }
    } else {
      if (this.state.routesBlocked) {
        this.closeDialogAndUnblockRoutes(true);
      }
    }
  }

  updateFilter(id: string, name: string, userPermissions: string[]) {
    if (this.state.filterParams.id === id) return false;

    AnalyticsUtil.logEvent("SWITCH_ENVIRONMENT", {
      fromEnvId: this.state.filterParams.id,
      toEnvId: id,
      fromEnvName: this.state.filterParams.name,
      toEnvName: name,
      mode: "CONFIGURATION",
    });
    this.setState({
      filterParams: {
        id,
        name,
        userPermissions,
      },
    });

    return true;
  }

  componentDidMount() {
    const urlObject = new URL(window?.location?.href);
    const pluginId = urlObject?.searchParams?.get("pluginId");

    // if there are no initial values, it means the form has not been initialized, hence we initialize the form.
    if (!this.props.initialValues) {
      this.props.initializeDatasource(omit(this.props.datasource, "name"));
    }

    // Create Temp Datasource on component mount,
    // if user hasnt saved datasource for the first time and refreshed the page
    if (
      !this.props.datasource &&
      this.props?.match?.params?.datasourceId === TEMP_DATASOURCE_ID
    ) {
      this.props.createTempDatasource({
        pluginId,
      });
    }

    if (!this.props.viewMode && !!pluginId) {
      this.blockRoutes();
    }

    this.props.loadFilePickerAction();
  }

  componentWillUnmount() {
    this.props.discardTempDatasource();
    this.props.deleteTempDSFromDraft();
    !!this.state.unblock && this.state.unblock();
  }

  closeDialog() {
    this.setState({ showDialog: false });
  }

  onSave() {
    this.props.toggleSaveActionFromPopupFlag(true);
  }

  blockRoutes() {
    this.setState({
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unblock: this.props?.history?.block((tx: any) => {
        this.setState(
          {
            // need to pass in query params as well as state, when user navigates away from ds form page
            navigation: () =>
              this.props.history.push(tx.pathname + tx.search, tx.state),
            showDialog: true,
            routesBlocked: true,
          },
          this.routesBlockFormChangeCallback.bind(this),
        );

        return false;
      }),
    });
  }

  onDiscard() {
    this.closeDialogAndUnblockRoutes();
    this.state.navigation();
    this.props.datasourceDiscardAction(this.props?.pluginId);

    if (!this.props.viewMode) {
      this.props.setDatasourceViewMode({
        datasourceId: this.props.datasourceId,
        viewMode: true,
      });
    }

    if (this.props.isFormDirty) {
      this.props.resetForm(this.props.formName);
    }
  }

  closeDialogAndUnblockRoutes(isNavigateBack?: boolean) {
    this.closeDialog();
    !!this.state.unblock && this.state.unblock();
    this.props.toggleSaveActionFlag(false);
    this.props.toggleSaveActionFromPopupFlag(false);
    this.setState({ routesBlocked: false });

    if (isNavigateBack) {
      this.state.navigation();
    }
  }

  datasourceDeleteTrigger() {
    !!this.state.unblock && this.state.unblock();
  }

  render() {
    const { formConfig, pluginId } = this.props;

    if (!pluginId) {
      return <EntityNotFoundPane />;
    }

    const content = this.renderDataSourceConfigForm(formConfig);

    return this.renderForm(content);
  }

  getSanitizedData = () => {
    return {
      ...normalizeValues(this.props.formData, this.props.configDetails),
      name: this.props.datasourceName,
    };
  };

  onCancel() {
    // if form has changed, show modal popup, or else simply set to view mode.
    if (this.props.isFormDirty) {
      this.setState({ showDialog: true });
    } else {
      this.props.setDatasourceViewMode({
        datasourceId: this.props.datasourceId,
        viewMode: true,
      });
    }
  }

  renderDatasourceInfo = () => {
    const {
      datasource,
      formConfig,
      formData,
      isPluginAuthFailed,
      isPluginAuthorized,
      pageId,
      plugin,
      pluginPackageName,
      viewMode,
    } = this.props;
    const isGoogleSheetPlugin = isGoogleSheetPluginDS(pluginPackageName);
    const authErrorMessage = getDatasourceErrorMessage(
      formData,
      plugin,
      this.state.filterParams.id,
    );
    const hideDatasourceSection =
      isGoogleSheetPlugin &&
      !isPluginAuthorized &&
      authErrorMessage == GSHEET_AUTHORIZATION_ERROR;

    return (
      <ViewModeWrapper data-testid="t--ds-review-section">
        {datasource &&
          isGoogleSheetPlugin &&
          isPluginAuthFailed &&
          datasource.id !== TEMP_DATASOURCE_ID && (
            <AuthMessage
              actionType={ActionType.AUTHORIZE}
              datasource={datasource}
              description={authErrorMessage}
              isInViewMode
              pageId={pageId}
            />
          )}
        {!isNil(formConfig) && !isNil(datasource) && !hideDatasourceSection && (
          <DatasourceInformation
            config={formConfig[0]}
            datasource={datasource}
            viewMode={viewMode}
          />
        )}
      </ViewModeWrapper>
    );
  };

  shouldShowTabs = () => {
    const { isPluginAllowedToPreviewData, isPluginAuthorized } = this.props;

    return isPluginAllowedToPreviewData && isPluginAuthorized;
  };

  renderTabsForViewMode = () => {
    const { datasource } = this.props;

    return (
      <ViewModeContainer>
        {this.shouldShowTabs() ? (
          <DatasourceTabs
            configChild={this.renderDatasourceInfo()}
            datasource={datasource as Datasource}
          />
        ) : (
          this.renderDatasourceInfo()
        )}
      </ViewModeContainer>
    );
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderDataSourceConfigForm = (sections: any) => {
    const {
      canDeleteDatasource,
      canManageDatasource,
      datasource,
      datasourceButtonConfiguration,
      datasourceId,
      formData,
      gsheetProjectID,
      gsheetToken,
      hiddenHeader,
      isDeleting,
      isInsideReconnectModal,
      isOnboardingFlow,
      isPluginAuthFailed,
      isPluginAuthorized,
      isSaving,
      isTesting,
      pageId,
      plugin,
      pluginImage,
      pluginPackageName,
      scopeValue,
      setDatasourceViewMode,
      showDebugger,
      viewMode,
    } = this.props;

    const isGoogleSheetPlugin = isGoogleSheetPluginDS(pluginPackageName);

    const createFlow = datasourceId === TEMP_DATASOURCE_ID;

    /*
      Currently we show error message banner for google sheets only, but in future
      if we want to extend this functionality for other plugins, we should be able
      to extend this function for other plugins
    */
    const authErrorMessage = getDatasourceErrorMessage(
      formData,
      plugin,
      this.state.filterParams.id,
    );

    const googleSheetsInfoMessage = createMessage(
      GOOGLE_SHEETS_INFO_BANNER_MESSAGE,
    );

    const showingTabsOnViewMode =
      this.shouldShowTabs() && viewMode && !isInsideReconnectModal;

    return (
      <>
        {!hiddenHeader && (
          <DSFormHeader
            canDeleteDatasource={canDeleteDatasource || false}
            canManageDatasource={canManageDatasource || false}
            datasource={datasource}
            datasourceId={datasourceId}
            isDeleting={isDeleting}
            isNewDatasource={createFlow}
            isPluginAuthorized={isPluginAuthorized}
            noBottomBorder={showingTabsOnViewMode}
            pluginImage={pluginImage}
            pluginName={plugin?.name || ""}
            pluginType={plugin?.type || ""}
            setDatasourceViewMode={setDatasourceViewMode}
            viewMode={viewMode}
          />
        )}
        <ResizerMainContainer>
          <ResizerContentContainer
            className={`saas-form-resizer-content ${
              showingTabsOnViewMode && "saas-form-resizer-content-show-tabs"
            }`}
          >
            <DSEditorWrapper>
              <DSDataFilter
                filterId={this.state.filterParams.id}
                isInsideReconnectModal={!!isInsideReconnectModal}
                pluginName={plugin?.name || ""}
                pluginType={plugin?.type || ""}
                updateFilter={this.updateFilter}
                viewMode={viewMode}
              />
              <div className="db-form-content-container">
                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                  viewMode={viewMode}
                >
                  {(!viewMode || createFlow || isInsideReconnectModal) && (
                    <>
                      {/* This adds error banner for google sheets datasource if the datasource is unauthorised */}
                      {datasource &&
                      isGoogleSheetPlugin &&
                      isPluginAuthFailed &&
                      datasourceId !== TEMP_DATASOURCE_ID ? (
                        <AuthMessage
                          datasource={datasource}
                          description={authErrorMessage}
                          pageId={pageId}
                        />
                      ) : null}
                      {!isNil(sections)
                        ? map(sections, this.renderMainSection)
                        : null}
                      {""}
                      {/* This adds information banner when creating google sheets datasource,
              this info banner explains why appsmith requires permissions from users google account */}
                      {datasource && isGoogleSheetPlugin && createFlow ? (
                        <AuthMessage
                          actionType={ActionType.DOCUMENTATION}
                          calloutType="info"
                          datasource={datasource}
                          description={googleSheetsInfoMessage}
                          pageId={pageId}
                        />
                      ) : null}
                    </>
                  )}
                  {viewMode &&
                    !isInsideReconnectModal &&
                    this.renderTabsForViewMode()}
                </Form>
                {/* Render datasource form call-to-actions */}
                {datasource && (
                  <DatasourceAuth
                    currentEnvironment={this.state.filterParams.id}
                    datasource={datasource}
                    datasourceButtonConfiguration={
                      datasourceButtonConfiguration
                    }
                    formData={formData}
                    formName={this.props.formName}
                    getSanitizedFormData={memoize(this.getSanitizedData)}
                    isInsideReconnectModal={isInsideReconnectModal}
                    isInvalid={validate(this.props.requiredFields, formData)}
                    isOnboardingFlow={isOnboardingFlow}
                    isSaving={isSaving}
                    isTesting={isTesting}
                    onCancel={() => this.onCancel()}
                    parentEntityId={pageId}
                    pluginName={plugin?.name || ""}
                    pluginPackageName={pluginPackageName}
                    pluginType={plugin?.type as PluginType}
                    scopeValue={scopeValue}
                    setDatasourceViewMode={setDatasourceViewMode}
                    shouldDisplayAuthMessage={!isGoogleSheetPlugin}
                    triggerSave={this.props.isDatasourceBeingSavedFromPopup}
                    viewMode={viewMode}
                  />
                )}
              </div>
            </DSEditorWrapper>
          </ResizerContentContainer>
          {showDebugger && <Debugger />}
        </ResizerMainContainer>
        <SaveOrDiscardDatasourceModal
          datasourceId={datasourceId}
          datasourcePermissions={datasource?.userPermissions || []}
          isOpen={this.state.showDialog}
          onClose={this.closeDialog}
          onDiscard={this.onDiscard}
          onSave={this.onSave}
          saveButtonText={createMessage(SAVE_AND_AUTHORIZE_BUTTON_TEXT)}
        />
        {!!gsheetToken ? (
          <GoogleSheetFilePicker
            datasourceId={datasourceId}
            gsheetProjectID={gsheetProjectID}
            gsheetToken={gsheetToken}
          />
        ) : null}
      </>
    );
  };
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: AppState, props: any) => {
  // This is only present during onboarding flow
  const currentApplicationIdForCreateNewApp =
    getCurrentApplicationIdForCreateNewApp(state);
  const applicationId = !!currentApplicationIdForCreateNewApp
    ? currentApplicationIdForCreateNewApp
    : getCurrentApplicationId(state);

  const basePageId = props.match?.params?.basePageId;
  const pageIdFromUrl = convertToPageIdSelector(state, basePageId);
  const pageId = props.pageId || pageIdFromUrl;

  const datasourceId = props.datasourceId || props.match?.params?.datasourceId;
  const { datasourcePane } = state.ui;
  const { datasources, plugins } = state.entities;
  let viewMode = isDatasourceInViewMode(state);
  const datasource = getDatasource(state, datasourceId);
  const { formConfigs } = plugins;
  const formData = getFormValues(DATASOURCE_SAAS_FORM)(state) as Datasource;
  const pluginId = get(datasource, "pluginId", "");
  const plugin = getPlugin(state, pluginId);
  const formConfig = formConfigs[pluginId];
  const initialValues = getFormInitialValues(DATASOURCE_SAAS_FORM)(
    state,
  ) as Datasource;

  // get scopeValue to be shown in analytical events
  const scopeValue = getDatasourceScopeValue(
    state,
    datasourceId,
    DATASOURCE_SAAS_FORM,
  );

  const datasourceButtonConfiguration = getDatasourceFormButtonConfig(
    state,
    pluginId,
  );
  const isFormDirty =
    datasourceId === TEMP_DATASOURCE_ID
      ? true
      : isDirty(DATASOURCE_SAAS_FORM)(state);

  const datasourcePermissions = datasource?.userPermissions || [];

  const isFeatureEnabled = selectFeatureFlagCheck(
    state,
    FEATURE_FLAG.license_gac_enabled,
  );

  const canManageDatasource = getHasManageDatasourcePermission(
    isFeatureEnabled,
    datasourcePermissions,
  );

  const canDeleteDatasource = getHasDeleteDatasourcePermission(
    isFeatureEnabled,
    datasourcePermissions,
  );

  const gsheetToken = getGsheetToken(state);
  const gsheetProjectID = getGsheetProjectID(state);
  const documentationLinks = getPluginDocumentationLinks(state);
  // Debugger render flag
  const showDebugger = showDebuggerFlag(state);

  const params: string = location.search;
  const viewModeFromURLParams = new URLSearchParams(params).get("viewMode");

  if (!!viewModeFromURLParams && viewModeFromURLParams?.length > 0) {
    viewMode = viewModeFromURLParams === "true";
  }

  const { currentEnvironment } = props;

  // Returning false to isPluginAuthorized if there exists no plugin or formdata.
  const isPluginAuthorized =
    !!plugin && !!formData
      ? isDatasourceAuthorizedForQueryCreation(
          formData,
          plugin,
          currentEnvironment,
        )
      : false;

  // Auth could fail because of either:
  // Failure to give permissions / Failure to select files / Failure on server
  const isPluginAuthFailed =
    !!plugin && !!formData
      ? isDatasourceAuthorizedForQueryCreation(
          formData,
          plugin,
          currentEnvironment,
          [
            AuthenticationStatus.FAILURE,
            AuthenticationStatus.FAILURE_ACCESS_DENIED,
            AuthenticationStatus.FAILURE_FILE_NOT_SELECTED,
          ],
        )
      : false;

  // should plugin be able to preview data
  const isPluginAllowedToPreviewData =
    !!plugin && isEnabledForPreviewData(datasource as Datasource, plugin);

  return {
    datasource,
    datasourceButtonConfiguration,
    datasourceId,
    documentationLink: documentationLinks[pluginId],
    isSaving: datasources.loading && datasources.loadingPluginId === pluginId,
    isDeleting: !!datasource?.isDeleting,
    isTesting: datasources.isTesting,
    formData: formData,
    formConfig,
    viewMode: viewMode ?? !props.isInsideReconnectModal,
    isNewDatasource: datasourcePane.newDatasource === TEMP_DATASOURCE_ID,
    pageId,
    plugin: plugin,
    pluginImage: getPluginImages(state)[pluginId],
    pluginPackageName:
      props.pluginPackageName || props.match?.params?.pluginPackageName,
    initialValues,
    isPluginAuthorized,
    pluginId: pluginId,
    actions: state.entities.actions,
    formName: DATASOURCE_SAAS_FORM,
    applicationId,
    canManageDatasource,
    canDeleteDatasource,
    datasourceName: datasource?.name ?? "",
    isDatasourceBeingSaved: datasources.isDatasourceBeingSaved,
    isDatasourceBeingSavedFromPopup:
      state.entities.datasources.isDatasourceBeingSavedFromPopup,
    isFormDirty,
    gsheetToken,
    gsheetProjectID,
    showDebugger,
    scopeValue,
    isPluginAuthFailed,
    featureFlags: selectFeatureFlags(state),
    isPluginAllowedToPreviewData,
  };
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any): DatasourceFormFunctions => ({
  discardTempDatasource: () => dispatch(removeTempDatasource()),
  deleteTempDSFromDraft: () => dispatch(deleteTempDSFromDraft()),
  toggleSaveActionFlag: (flag) => dispatch(toggleSaveActionFlag(flag)),
  toggleSaveActionFromPopupFlag: (flag) =>
    dispatch(toggleSaveActionFromPopupFlag(flag)),
  setDatasourceViewMode: (payload: {
    datasourceId: string;
    viewMode: boolean;
  }) => {
    // Construct URLSearchParams object instance from current URL querystring.
    const queryParams = new URLSearchParams(window.location.search);

    queryParams.set("viewMode", payload.viewMode.toString());
    // Replace current querystring with the new one.
    history.replaceState({}, "", "?" + queryParams.toString());

    dispatch(setDatasourceViewMode(payload));
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createTempDatasource: (data: any) =>
    dispatch(createTempDatasourceFromForm(data)),
  loadFilePickerAction: () => dispatch(loadFilePickerAction()),
  datasourceDiscardAction: (pluginId) =>
    dispatch(datasourceDiscardAction(pluginId)),
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initializeDatasource: (values: any) =>
    dispatch(initialize(DATASOURCE_SAAS_FORM, values)),
  resetForm: (formName: string) => dispatch(reset(formName)),
});

const SaaSEditor = connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  reduxForm<Datasource, DatasourceSaaSEditorProps>({
    form: DATASOURCE_SAAS_FORM,
    enableReinitialize: true,
  })(DatasourceSaaSEditor),
);

export default connect((state) => ({
  currentEnvironment: getDefaultEnvironmentId(state),
}))(SaasEditorWrapper);
