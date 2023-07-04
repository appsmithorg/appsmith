import React from "react";
import { get, isEqual, isNil, map, memoize, omit } from "lodash";
import { DATASOURCE_SAAS_FORM } from "@appsmith/constants/forms";
import type { Datasource } from "entities/Datasource";
import { ActionType } from "entities/Datasource";
import type { InjectedFormProps } from "redux-form";
import {
  getFormValues,
  isDirty,
  reduxForm,
  initialize,
  getFormInitialValues,
} from "redux-form";
import type { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import {
  getDatasource,
  getPluginImages,
  getDatasourceFormButtonConfig,
  getPlugin,
  getPluginDocumentationLinks,
  getDatasourceScopeValue,
} from "selectors/entitiesSelector";
import type { ActionDataState } from "reducers/entityReducers/actionsReducer";
import type { JSONtoFormProps } from "../DataSourceEditor/JSONtoForm";
import { JSONtoForm } from "../DataSourceEditor/JSONtoForm";
import { normalizeValues, validate } from "components/formControls/utils";
import {
  getCurrentApplicationId,
  getGsheetProjectID,
  getGsheetToken,
  getPagePermissions,
} from "selectors/editorSelectors";
import DatasourceAuth from "pages/common/datasourceAuth";
import EntityNotFoundPane from "../EntityNotFoundPane";
import type { Plugin } from "api/PluginApi";
import {
  isDatasourceAuthorizedForQueryCreation,
  isGoogleSheetPluginDS,
} from "utils/editorContextUtils";
import type { PluginType } from "entities/Action";
import AuthMessage from "pages/common/datasourceAuth/AuthMessage";
import { isDatasourceInViewMode } from "selectors/ui";
import {
  hasCreateDatasourceActionPermission,
  hasDeleteDatasourcePermission,
  hasManageDatasourcePermission,
} from "@appsmith/utils/permissionHelpers";
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
} from "@appsmith/constants/messages";
import { getDatasourceErrorMessage } from "./errorUtils";
import GoogleSheetFilePicker from "./GoogleSheetFilePicker";
import DatasourceInformation from "./../DataSourceEditor/DatasourceSection";
import type { ControlProps } from "components/formControls/BaseControl";
import { DSFormHeader } from "../DataSourceEditor/DSFormHeader";
import Debugger, {
  ResizerContentContainer,
  ResizerMainContainer,
} from "../DataSourceEditor/Debugger";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import { Form, ViewModeWrapper } from "../DataSourceEditor/DBForm";
import { getCurrentEnvironment } from "@appsmith/utils/Environments";

interface StateProps extends JSONtoFormProps {
  applicationId: string;
  canManageDatasource?: boolean;
  canDeleteDatasource?: boolean;
  canCreateDatasourceActions?: boolean;
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
}
interface DatasourceFormFunctions {
  discardTempDatasource: () => void;
  deleteTempDSFromDraft: () => void;
  toggleSaveActionFlag: (flag: boolean) => void;
  toggleSaveActionFromPopupFlag: (flag: boolean) => void;
  createTempDatasource: (data: any) => void;
  setDatasourceViewMode: (viewMode: boolean) => void;
  loadFilePickerAction: () => void;
  datasourceDiscardAction: (pluginId: string) => void;
  initializeDatasource: (values: any) => void;
}

type DatasourceSaaSEditorProps = StateProps &
  DatasourceFormFunctions &
  SaasEditorWrappperProps &
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
type State = {
  showDialog: boolean;
  routesBlocked: boolean;
  unblock(): void;
  navigation(): void;
};

type SaasEditorWrappperProps = RouteProps & {
  hiddenHeader?: boolean; // for reconnect modal
  isInsideReconnectModal?: boolean; // for reconnect modal
};
type RouteProps = {
  datasourceId: string;
  pageId: string;
  pluginPackageName: string;
};

type SaasEditorWrappperState = {
  requiredFields: Record<string, ControlProps>;
  configDetails: Record<string, string>;
  currentEditingEnvironment: string;
};
class SaasEditorWrapper extends React.Component<
  SaasEditorWrappperProps,
  SaasEditorWrappperState
> {
  constructor(props: SaasEditorWrappperProps) {
    super(props);
    this.state = {
      requiredFields: {},
      configDetails: {},
      currentEditingEnvironment: getCurrentEnvironment(),
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
        currentEnvironment={this.state.currentEditingEnvironment}
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
      unblock: () => {
        return undefined;
      },
      navigation: () => {
        return undefined;
      },
    };
    this.closeDialog = this.closeDialog.bind(this);
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

    // When save button is clicked in DS form, routes should be unblocked
    if (this.props.isDatasourceBeingSaved) {
      this.closeDialogAndUnblockRoutes();
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
      this.props.match.params.datasourceId === TEMP_DATASOURCE_ID
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

  renderDataSourceConfigForm = (sections: any) => {
    const {
      canCreateDatasourceActions,
      canDeleteDatasource,
      canManageDatasource,
      datasource,
      datasourceButtonConfiguration,
      datasourceId,
      formConfig,
      formData,
      gsheetProjectID,
      gsheetToken,
      hiddenHeader,
      isDeleting,
      isInsideReconnectModal,
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
    const authErrorMessage = getDatasourceErrorMessage(formData, plugin);

    const googleSheetsInfoMessage = createMessage(
      GOOGLE_SHEETS_INFO_BANNER_MESSAGE,
    );

    const hideDatasourceSection =
      isGoogleSheetPlugin &&
      !isPluginAuthorized &&
      authErrorMessage == GSHEET_AUTHORIZATION_ERROR;

    return (
      <>
        {!hiddenHeader && (
          <DSFormHeader
            canCreateDatasourceActions={canCreateDatasourceActions || false}
            canDeleteDatasource={canDeleteDatasource || false}
            canManageDatasource={canManageDatasource || false}
            datasource={datasource}
            datasourceId={datasourceId}
            isDeleting={isDeleting}
            isNewDatasource={createFlow}
            isPluginAuthorized={isPluginAuthorized}
            pluginImage={pluginImage}
            pluginName={plugin?.name || ""}
            pluginType={plugin?.type || ""}
            setDatasourceViewMode={setDatasourceViewMode}
            viewMode={viewMode}
          />
        )}
        <ResizerMainContainer>
          <ResizerContentContainer className="db-form-resizer-content">
            <Form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              showFilterComponent={false}
            >
              {(!viewMode || createFlow || isInsideReconnectModal) && (
                <>
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
                  {/* This adds error banner for google sheets datasource if the datasource is unauthorised */}
                  {datasource &&
                  isGoogleSheetPlugin &&
                  !isPluginAuthorized &&
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
                </>
              )}
              {viewMode && !isInsideReconnectModal && (
                <ViewModeWrapper>
                  {datasource && isGoogleSheetPlugin && !isPluginAuthorized ? (
                    <AuthMessage
                      actionType={ActionType.AUTHORIZE}
                      datasource={datasource}
                      description={authErrorMessage}
                      isInViewMode
                      pageId={pageId}
                    />
                  ) : null}
                  {!isNil(formConfig) &&
                  !isNil(datasource) &&
                  !hideDatasourceSection ? (
                    <DatasourceInformation
                      config={formConfig[0]}
                      currentEnvironment={this.props.currentEnvironment}
                      datasource={datasource}
                      viewMode={viewMode}
                    />
                  ) : undefined}
                </ViewModeWrapper>
              )}
            </Form>
            {/* Render datasource form call-to-actions */}
            {datasource && (
              <DatasourceAuth
                currentEnvironment={this.props.currentEnvironment}
                datasource={datasource}
                datasourceButtonConfiguration={datasourceButtonConfiguration}
                formData={formData}
                getSanitizedFormData={memoize(this.getSanitizedData)}
                isInsideReconnectModal={isInsideReconnectModal}
                isInvalid={validate(this.props.requiredFields, formData)}
                isSaving={isSaving}
                isTesting={isTesting}
                pageId={pageId}
                pluginName={plugin?.name || ""}
                pluginPackageName={pluginPackageName}
                pluginType={plugin?.type as PluginType}
                scopeValue={scopeValue}
                setDatasourceViewMode={setDatasourceViewMode}
                shouldDisplayAuthMessage={!isGoogleSheetPlugin}
                showFilterComponent={false}
                triggerSave={this.props.isDatasourceBeingSavedFromPopup}
                viewMode={viewMode}
              />
            )}
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

const mapStateToProps = (state: AppState, props: any) => {
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

  const canManageDatasource = hasManageDatasourcePermission(
    datasourcePermissions,
  );

  const canDeleteDatasource = hasDeleteDatasourcePermission(
    datasourcePermissions,
  );

  const pagePermissions = getPagePermissions(state);
  const canCreateDatasourceActions = hasCreateDatasourceActionPermission([
    ...datasourcePermissions,
    ...pagePermissions,
  ]);

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

  const isPluginAuthorized =
    !!plugin && !!formData
      ? isDatasourceAuthorizedForQueryCreation(formData, plugin)
      : true;

  return {
    datasource,
    datasourceButtonConfiguration,
    datasourceId,
    documentationLink: documentationLinks[pluginId],
    isSaving: datasources.loading,
    isDeleting: !!datasource?.isDeleting,
    isTesting: datasources.isTesting,
    formData: formData,
    formConfig,
    viewMode: viewMode ?? !props.isInsideReconnectModal,
    isNewDatasource: datasourcePane.newDatasource === TEMP_DATASOURCE_ID,
    pageId: props.pageId || props.match?.params?.pageId,
    plugin: plugin,
    pluginImage: getPluginImages(state)[pluginId],
    pluginPackageName:
      props.pluginPackageName || props.match?.params?.pluginPackageName,
    initialValues,
    isPluginAuthorized,
    pluginId: pluginId,
    actions: state.entities.actions,
    formName: DATASOURCE_SAAS_FORM,
    applicationId: getCurrentApplicationId(state),
    canManageDatasource,
    canDeleteDatasource,
    datasourceName: datasource?.name ?? "",
    isDatasourceBeingSaved: datasources.isDatasourceBeingSaved,
    isDatasourceBeingSavedFromPopup:
      state.entities.datasources.isDatasourceBeingSavedFromPopup,
    isFormDirty,
    canCreateDatasourceActions,
    gsheetToken,
    gsheetProjectID,
    showDebugger,
    scopeValue,
  };
};

const mapDispatchToProps = (dispatch: any): DatasourceFormFunctions => ({
  discardTempDatasource: () => dispatch(removeTempDatasource()),
  deleteTempDSFromDraft: () => dispatch(deleteTempDSFromDraft()),
  toggleSaveActionFlag: (flag) => dispatch(toggleSaveActionFlag(flag)),
  toggleSaveActionFromPopupFlag: (flag) =>
    dispatch(toggleSaveActionFromPopupFlag(flag)),
  setDatasourceViewMode: (viewMode: boolean) => {
    // Construct URLSearchParams object instance from current URL querystring.
    const queryParams = new URLSearchParams(window.location.search);

    queryParams.set("viewMode", viewMode.toString());
    // Replace current querystring with the new one.
    history.replaceState({}, "", "?" + queryParams.toString());

    dispatch(setDatasourceViewMode(viewMode));
  },
  createTempDatasource: (data: any) =>
    dispatch(createTempDatasourceFromForm(data)),
  loadFilePickerAction: () => dispatch(loadFilePickerAction()),
  datasourceDiscardAction: (pluginId) =>
    dispatch(datasourceDiscardAction(pluginId)),
  initializeDatasource: (values: any) =>
    dispatch(initialize(DATASOURCE_SAAS_FORM, values)),
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

export default SaasEditorWrapper;
