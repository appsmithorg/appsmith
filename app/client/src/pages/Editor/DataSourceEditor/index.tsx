import React from "react";
import { connect } from "react-redux";
import { getFormInitialValues, getFormValues, isDirty } from "redux-form";
import type { AppState } from "@appsmith/reducers";
import { get, isEqual, memoize } from "lodash";
import {
  getPluginImages,
  getDatasource,
  getPlugin,
  getDatasourceFormButtonConfig,
} from "selectors/entitiesSelector";
import {
  switchDatasource,
  setDatasourceViewMode,
  removeTempDatasource,
  deleteTempDSFromDraft,
  toggleSaveActionFlag,
  toggleSaveActionFromPopupFlag,
  createTempDatasourceFromForm,
  resetDefaultKeyValPairFlag,
  initializeDatasourceFormDefaults,
  datasourceDiscardAction,
} from "actions/datasourceActions";
import {
  DATASOURCE_DB_FORM,
  DATASOURCE_REST_API_FORM,
} from "@appsmith/constants/forms";
import DataSourceEditorForm from "./DBForm";
import RestAPIDatasourceForm from "./RestAPIDatasourceForm";
import type { Datasource } from "entities/Datasource";
import type { RouteComponentProps } from "react-router";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import { DatasourceComponentTypes } from "api/PluginApi";
import DatasourceSaasForm from "../SaaSEditor/DatasourceForm";

import {
  getCurrentApplicationId,
  getPagePermissions,
  selectURLSlugs,
} from "selectors/editorSelectors";
import { saasEditorDatasourceIdURL } from "RouteBuilder";
import {
  createMessage,
  REST_API_AUTHORIZATION_APPSMITH_ERROR,
  REST_API_AUTHORIZATION_FAILED,
  REST_API_AUTHORIZATION_SUCCESSFUL,
  SAVE_BUTTON_TEXT,
} from "@appsmith/constants/messages";
import { isDatasourceInViewMode } from "selectors/ui";
import { getQueryParams } from "utils/URLUtils";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import SaveOrDiscardDatasourceModal from "./SaveOrDiscardDatasourceModal";
import {
  hasCreateDatasourceActionPermission,
  hasDeleteDatasourcePermission,
  hasManageDatasourcePermission,
} from "@appsmith/utils/permissionHelpers";

import { toast } from "design-system";
import styled from "styled-components";
import CloseEditor from "components/editorComponents/CloseEditor";
import { isDatasourceAuthorizedForQueryCreation } from "utils/editorContextUtils";
import Debugger, {
  ResizerContentContainer,
  ResizerMainContainer,
} from "./Debugger";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import DatasourceAuth from "pages/common/datasourceAuth";
import {
  getTrimmedData,
  normalizeValues,
  validate,
} from "components/formControls/utils";
import type { ControlProps } from "components/formControls/BaseControl";
import type { ApiDatasourceForm } from "entities/Datasource/RestAPIForm";
import { formValuesToDatasource } from "transformers/RestAPIDatasourceFormTransformer";
import { DSFormHeader } from "./DSFormHeader";
import type { PluginType } from "entities/Action";
import { PluginPackageName } from "entities/Action";
import DSDataFilter from "@appsmith/components/DSDataFilter";
import { DEFAULT_ENV_ID } from "@appsmith/api/ApiUtils";

interface ReduxStateProps {
  canCreateDatasourceActions: boolean;
  canDeleteDatasource: boolean;
  canManageDatasource: boolean;
  datasourceButtonConfiguration: string[] | undefined;
  datasourceId: string;
  formData: Datasource | ApiDatasourceForm;
  formName: string;
  isSaving: boolean;
  isTesting: boolean;
  formConfig: any[];
  isDeleting: boolean;
  isNewDatasource: boolean;
  isPluginAuthorized: boolean;
  pageId: string;
  pluginImage: string;
  pluginId: string;
  viewMode: boolean;
  pluginType: string;
  pluginName: string;
  pluginDatasourceForm: string;
  pluginPackageName: string;
  applicationId: string;
  applicationSlug: string;
  pageSlug: string;
  // isInsideReconnectModal: indicates that the datasource form is rendering inside reconnect modal
  isInsideReconnectModal?: boolean;
  isDatasourceBeingSaved: boolean;
  triggerSave: boolean;
  isFormDirty: boolean;
  datasource: Datasource | ApiDatasourceForm | undefined;
  defaultKeyValueArrayConfig: Array<string>;
  initialValue: Datasource | ApiDatasourceForm | undefined;
  showDebugger: boolean;
}

const Form = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  flex: 1;
`;

type Props = ReduxStateProps &
  DatasourcePaneFunctions &
  RouteComponentProps<{
    datasourceId: string;
    pageId: string;
  }>;

const DSEditorWrapper = styled.div`
  height: calc(100vh - ${(props) => props.theme.headerHeight});
  overflow: hidden;
  display: flex;
  flex-direction: row;
`;

type DatasourceFilterState = {
  id: string;
  name: string;
  userPermissions: string[];
  showFilterPane: boolean;
};

/*
  **** State Variables Description ****
  showDialog: flag used to show/hide the datasource discard popup
  routesBlocked: flag used to identity if routes are blocked or not
  readUrlParams: flag used to identity if url params are read or not
  requiredFields: object containing the required fields for the datasource form
  configDetails: object containing the details of the datasource form
  filterParams: object containing the details of the datasource filter
  unblock: on blocking routes using history.block, it returns a function which can be used to unblock the routes
  navigation: function that navigates to path that we want to transition to, after discard action on datasource discard dialog popup
*/
type State = {
  showDialog: boolean;
  routesBlocked: boolean;
  readUrlParams: boolean;
  requiredFields: Record<string, ControlProps>;
  configDetails: Record<string, string>;
  filterParams: DatasourceFilterState;

  unblock(): void;
  navigation(): void;
};

export interface DatasourcePaneFunctions {
  switchDatasource: (id: string) => void;
  setDatasourceViewMode: (viewMode: boolean) => void;
  discardTempDatasource: () => void;
  deleteTempDSFromDraft: () => void;
  toggleSaveActionFlag: (flag: boolean) => void;
  toggleSaveActionFromPopupFlag: (flag: boolean) => void;
  createTempDatasource: (data: any) => void;
  resetDefaultKeyValPairFlag: () => void;
  initializeFormWithDefaults: (pluginType: string) => void;
  datasourceDiscardAction: (pluginId: string) => void;
}

class DatasourceEditorRouter extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showDialog: false,
      routesBlocked: false,
      readUrlParams: false,
      requiredFields: {},
      configDetails: {},
      filterParams: {
        id: DEFAULT_ENV_ID,
        name: "",
        userPermissions: [],
        showFilterPane: false,
      },
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
  }

  componentDidUpdate(prevProps: Props) {
    //Fix to prevent restapi datasource from being set in DatasourceDBForm in view mode
    if (
      this.props.pluginDatasourceForm !==
        DatasourceComponentTypes.RestAPIDatasourceForm &&
      this.props.datasourceId &&
      this.props.datasourceId !== prevProps.datasourceId
    ) {
      this.props.switchDatasource(this.props.datasourceId);
    }

    const urlObject = new URL(window.location.href);
    const pluginId = urlObject?.searchParams.get("pluginId");
    // update block state when form becomes dirty/view mode is switched on
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
    this.setViewModeFromQueryParams();

    if (
      !isEqual(
        this.props.defaultKeyValueArrayConfig,
        prevProps.defaultKeyValueArrayConfig,
      )
    ) {
      this.props.initializeFormWithDefaults(this.props.pluginType);
    }

    // if the datasource id changes, we need to reset the required fields and configDetails
    if (this.props.datasourceId !== prevProps.datasourceId) {
      this.setState({
        requiredFields: {},
        configDetails: {},
      });
    }
  }

  getEnvironmentId = () => {
    if (
      this.props.isInsideReconnectModal &&
      this.state.filterParams.id.length === 0 &&
      !!this.props.datasource
    ) {
      return Object.keys(
        (this.props.datasource as Datasource).datasourceStorages,
      )[0];
    }
    return this.state.filterParams.id;
  };

  componentDidMount() {
    const urlObject = new URL(window.location.href);
    const pluginId = urlObject?.searchParams.get("pluginId");
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

    // In case of Rest API forms, we need to set view mode from query params
    if (
      this.props.pluginDatasourceForm ===
      DatasourceComponentTypes.RestAPIDatasourceForm
    ) {
      this.setViewModeFromQueryParams();
    }

    //Fix to prevent restapi datasource from being set in DatasourceDBForm in datasource view mode
    //TODO: Needs cleanup
    if (
      this.props.datasourceId &&
      this.props.pluginDatasourceForm !==
        DatasourceComponentTypes.RestAPIDatasourceForm
    ) {
      this.props.switchDatasource(this.props.datasourceId);
    }

    if (
      this.props.pluginDatasourceForm ===
        DatasourceComponentTypes.RestAPIDatasourceForm &&
      this.props.location
    ) {
      const search = new URLSearchParams(this.props.location.search);
      const responseStatus = search.get("response_status");
      const responseMessage = search.get("display_message");
      if (responseStatus) {
        // Set default error message
        let message = REST_API_AUTHORIZATION_FAILED;
        if (responseStatus === "success") {
          message = REST_API_AUTHORIZATION_SUCCESSFUL;
        } else if (responseStatus === "appsmith_error") {
          message = REST_API_AUTHORIZATION_APPSMITH_ERROR;
        }
        toast.show(responseMessage || createMessage(message));
      }
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
            this.props.setDatasourceViewMode(false);
          },
        );
      }
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

  componentWillUnmount() {
    this.props.discardTempDatasource();
    this.props.deleteTempDSFromDraft();
    !!this.state.unblock && this.state.unblock();
    this.props.resetDefaultKeyValPairFlag();
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

  blockRoutes() {
    this.setState({
      unblock: this.props?.history?.block((tx: any) => {
        const nextPath = tx.pathname + tx.search;
        const prevPath =
          this.props.history.location.pathname +
          this.props.history.location.search;
        // On reload, it goes from same path to same path, we do not need to show popup in that case
        if (nextPath !== prevPath && this.props.isFormDirty) {
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
        }
      }),
    });
  }

  closeDialog() {
    this.setState({ showDialog: false });
  }

  onSave() {
    this.props.toggleSaveActionFromPopupFlag(true);
  }

  onDiscard() {
    this.closeDialogAndUnblockRoutes();
    this.props.discardTempDatasource();
    this.props.deleteTempDSFromDraft();
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

  resetDefaultKeyValPairFlag() {
    if (
      this.props.defaultKeyValueArrayConfig.length > 0 &&
      !!this.props.initialValue
    ) {
      this.props.resetDefaultKeyValPairFlag();
    }
  }

  updateFilter = (
    id: string,
    name: string,
    userPermissions: string[],
    showFilterPane: boolean,
  ) => {
    this.setState({
      filterParams: {
        id,
        name,
        userPermissions,
        showFilterPane,
      },
    });
  };

  renderSaveDisacardModal() {
    return (
      <SaveOrDiscardDatasourceModal
        datasourceId={this.props.datasourceId}
        datasourcePermissions={this.props.datasource?.userPermissions || []}
        isOpen={this.state.showDialog}
        onClose={this.closeDialog}
        onDiscard={this.onDiscard}
        onSave={this.onSave}
        saveButtonText={createMessage(SAVE_BUTTON_TEXT)}
      />
    );
  }

  renderForm() {
    const {
      datasource,
      datasourceId,
      formConfig,
      formData,
      formName,
      isFormDirty,
      isInsideReconnectModal,
      isSaving,
      location,
      pageId,
      pluginDatasourceForm,
      pluginName,
      pluginPackageName,
      pluginType,
      viewMode,
    } = this.props;

    const shouldViewMode = viewMode && !isInsideReconnectModal;
    // Check for specific form types first
    if (
      pluginDatasourceForm === DatasourceComponentTypes.RestAPIDatasourceForm &&
      !shouldViewMode
    ) {
      return (
        <>
          <RestAPIDatasourceForm
            applicationId={this.props.applicationId}
            datasource={datasource}
            datasourceId={datasourceId}
            formData={formData}
            formName={formName}
            hiddenHeader={isInsideReconnectModal}
            isFormDirty={isFormDirty}
            isSaving={isSaving}
            location={location}
            pageId={pageId}
            pluginName={pluginName}
            pluginPackageName={pluginPackageName}
            showFilterComponent={this.state.filterParams.showFilterPane}
          />
          {this.renderSaveDisacardModal()}
        </>
      );
    }

    // Default to DB Editor Form
    return (
      <>
        <DataSourceEditorForm
          applicationId={this.props.applicationId}
          currentEnvironment={this.getEnvironmentId()}
          datasourceId={datasourceId}
          formConfig={formConfig}
          formData={formData}
          formName={DATASOURCE_DB_FORM}
          hiddenHeader={isInsideReconnectModal}
          isSaving={isSaving}
          pageId={pageId}
          pluginType={pluginType}
          setupConfig={this.setupConfig}
          showFilterComponent={this.state.filterParams.showFilterPane}
          viewMode={viewMode && !isInsideReconnectModal}
        />
        {this.renderSaveDisacardModal()}
      </>
    );
  }

  // returns normalized and trimmed datasource form data
  getSanitizedData = () => {
    if (
      this.props.pluginDatasourceForm ===
      DatasourceComponentTypes.RestAPIDatasourceForm
    )
      return formValuesToDatasource(
        this.props.datasource as Datasource,
        this.props.formData as ApiDatasourceForm,
      );
    else
      return getTrimmedData({
        ...normalizeValues(
          { ...this.props.formData },
          this.state.configDetails,
        ),
        name: this.props.datasource?.name || "",
      });
  };

  render() {
    const {
      canCreateDatasourceActions,
      canDeleteDatasource,
      canManageDatasource,
      datasource,
      datasourceButtonConfiguration,
      datasourceId,
      formData,
      history,
      isDeleting,
      isInsideReconnectModal,
      isNewDatasource,
      isPluginAuthorized,
      isSaving,
      isTesting,
      pageId,
      pluginId,
      pluginImage,
      pluginName,
      pluginPackageName,
      pluginType,
      setDatasourceViewMode,
      showDebugger,
      triggerSave,
      viewMode,
    } = this.props;

    if (!pluginId && datasourceId) {
      return <EntityNotFoundPane />;
    }

    // for saas form
    if (pluginType === "SAAS") {
      // todo check if we can remove the flag here
      if (isInsideReconnectModal) {
        return (
          <DatasourceSaasForm
            datasourceId={datasourceId}
            hiddenHeader
            isInsideReconnectModal={isInsideReconnectModal}
            pageId={pageId}
            pluginPackageName={pluginPackageName}
          />
        );
      }
      history.push(
        saasEditorDatasourceIdURL({
          pageId,
          pluginPackageName,
          datasourceId,
        }),
      );
      return null;
    }

    return (
      <Form
        className="t--json-to-form-wrapper"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <CloseEditor />
        {!isInsideReconnectModal && (
          <DSFormHeader
            canCreateDatasourceActions={canCreateDatasourceActions}
            canDeleteDatasource={canDeleteDatasource}
            canManageDatasource={canManageDatasource}
            datasource={datasource}
            datasourceId={datasourceId}
            isDeleting={isDeleting}
            isNewDatasource={isNewDatasource}
            isPluginAuthorized={isPluginAuthorized}
            pluginImage={pluginImage}
            pluginName={pluginName}
            pluginType={pluginType}
            setDatasourceViewMode={setDatasourceViewMode}
            viewMode={viewMode}
          />
        )}
        <ResizerMainContainer>
          <ResizerContentContainer className="db-form-resizer-content">
            <DSEditorWrapper>
              <DSDataFilter
                isInsideReconnectModal={!!isInsideReconnectModal}
                pluginType={this.props.pluginType}
                updateFilter={this.updateFilter}
                viewMode={viewMode}
              />
              <div className="db-form-content-container">
                {this.renderForm()}
                {/* Render datasource form call-to-actions */}
                {datasource && (
                  <DatasourceAuth
                    currentEnvironment={this.getEnvironmentId()}
                    datasource={datasource as Datasource}
                    datasourceButtonConfiguration={
                      datasourceButtonConfiguration
                    }
                    formData={formData}
                    getSanitizedFormData={memoize(this.getSanitizedData)}
                    isFormDirty={this.props.isFormDirty}
                    isInsideReconnectModal={isInsideReconnectModal}
                    isInvalid={this.validateForm()}
                    isSaving={isSaving}
                    isTesting={isTesting}
                    pluginName={pluginName}
                    pluginPackageName={pluginPackageName}
                    pluginType={pluginType as PluginType}
                    setDatasourceViewMode={setDatasourceViewMode}
                    showFilterComponent={this.state.filterParams.showFilterPane}
                    triggerSave={triggerSave}
                    viewMode={viewMode}
                  />
                )}
              </div>
            </DSEditorWrapper>
          </ResizerContentContainer>
          {showDebugger && <Debugger />}
        </ResizerMainContainer>
      </Form>
    );
  }
  validateForm(): boolean {
    const {
      canManageDatasource,
      datasourceId,
      formData,
      pluginDatasourceForm,
    } = this.props;
    if (
      pluginDatasourceForm === DatasourceComponentTypes.RestAPIDatasourceForm
    ) {
      const createMode = datasourceId === TEMP_DATASOURCE_ID;
      if (!formData) return true;
      return (
        !(formData as ApiDatasourceForm).url ||
        (!createMode && !canManageDatasource)
      );
    }
    return validate(this.state.requiredFields, formData);
  }
}

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const datasourceId = props.datasourceId ?? props.match?.params?.datasourceId;
  const { datasourcePane } = state.ui;
  const { datasources, plugins } = state.entities;
  const viewMode = isDatasourceInViewMode(state);
  const datasource = getDatasource(state, datasourceId) as
    | Datasource
    | ApiDatasourceForm;
  const { formConfigs } = plugins;
  const pluginId = get(datasource, "pluginId", "");
  const plugin = getPlugin(state, pluginId);
  const { applicationSlug, pageSlug } = selectURLSlugs(state);
  const formName =
    plugin?.type === "API" ? DATASOURCE_REST_API_FORM : DATASOURCE_DB_FORM;
  const formData = getFormValues(formName)(state) as
    | Datasource
    | ApiDatasourceForm;
  const isFormDirty =
    datasourceId === TEMP_DATASOURCE_ID ? true : isDirty(formName)(state);
  const initialValue = getFormInitialValues(formName)(state) as
    | Datasource
    | ApiDatasourceForm;
  const defaultKeyValueArrayConfig =
    datasourcePane?.defaultKeyValueArrayConfig as any;

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
  // Debugger render flag
  const showDebugger = showDebuggerFlag(state);
  const pluginPackageName = plugin?.packageName ?? "";

  const isPluginAuthorized =
    pluginPackageName === PluginPackageName.GOOGLE_SHEETS
      ? plugin &&
        isDatasourceAuthorizedForQueryCreation(formData as Datasource, plugin)
      : true;

  const datasourceButtonConfiguration = getDatasourceFormButtonConfig(
    state,
    pluginId,
  );

  return {
    canCreateDatasourceActions,
    canDeleteDatasource,
    canManageDatasource,
    datasourceButtonConfiguration,
    datasourceId,
    pluginImage: getPluginImages(state)[pluginId],
    formData,
    formName,
    isInsideReconnectModal: props.isInsideReconnectModal ?? false,
    pluginId,
    isSaving: datasources.loading,
    isDeleting: !!(datasource as Datasource)?.isDeleting,
    isPluginAuthorized: !!isPluginAuthorized,
    isTesting: datasources.isTesting,
    formConfig: formConfigs[pluginId] || [],
    isNewDatasource: datasourcePane.newDatasource === TEMP_DATASOURCE_ID,
    pageId: props.pageId ?? props.match?.params?.pageId,
    viewMode,
    pluginType: plugin?.type ?? "",
    pluginName: plugin?.name ?? "",
    pluginDatasourceForm:
      plugin?.datasourceComponent ?? DatasourceComponentTypes.AutoForm,
    pluginPackageName,
    applicationId: props.applicationId ?? getCurrentApplicationId(state),
    applicationSlug,
    pageSlug,
    isDatasourceBeingSaved: datasources.isDatasourceBeingSaved,
    triggerSave: datasources.isDatasourceBeingSavedFromPopup,
    isFormDirty,
    datasource,
    defaultKeyValueArrayConfig,
    initialValue,
    showDebugger,
  };
};

const mapDispatchToProps = (
  dispatch: any,
  ownProps: any,
): DatasourcePaneFunctions => ({
  switchDatasource: (id: string) => {
    // on reconnect data modal, it shouldn't be redirected to datasource edit page
    dispatch(switchDatasource(id, ownProps.isInsideReconnectModal));
  },
  setDatasourceViewMode: (viewMode: boolean) =>
    dispatch(setDatasourceViewMode(viewMode)),
  discardTempDatasource: () => dispatch(removeTempDatasource()),
  deleteTempDSFromDraft: () => dispatch(deleteTempDSFromDraft()),
  toggleSaveActionFlag: (flag) => dispatch(toggleSaveActionFlag(flag)),
  toggleSaveActionFromPopupFlag: (flag) =>
    dispatch(toggleSaveActionFromPopupFlag(flag)),
  createTempDatasource: (data: any) =>
    dispatch(createTempDatasourceFromForm(data)),
  resetDefaultKeyValPairFlag: () => dispatch(resetDefaultKeyValPairFlag()),
  initializeFormWithDefaults: (pluginType: string) =>
    dispatch(initializeDatasourceFormDefaults(pluginType)),
  datasourceDiscardAction: (pluginId) =>
    dispatch(datasourceDiscardAction(pluginId)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DatasourceEditorRouter);
