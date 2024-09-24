import React from "react";
import { connect } from "react-redux";
import {
  getFormInitialValues,
  getFormValues,
  initialize,
  isDirty,
  reset,
} from "redux-form";
import type { AppState } from "ee/reducers";
import { get, isEmpty, isEqual, isNil, memoize, merge } from "lodash";
import {
  getPluginImages,
  getDatasource,
  getPlugin,
  getDatasourceFormButtonConfig,
} from "ee/selectors/entitiesSelector";
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
  setDatasourceViewModeFlag,
} from "actions/datasourceActions";
import {
  DATASOURCE_DB_FORM,
  DATASOURCE_REST_API_FORM,
} from "ee/constants/forms";
import DataSourceEditorForm from "./DBForm";
import RestAPIDatasourceForm from "./RestAPIDatasourceForm";
import type { Datasource, DatasourceStorage } from "entities/Datasource";
import { ToastMessageType } from "entities/Datasource";
import type { RouteComponentProps } from "react-router";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import { DatasourceComponentTypes } from "api/PluginApi";
import DatasourceSaasForm from "../SaaSEditor/DatasourceForm";
import {
  getCurrentApplicationId,
  selectURLSlugs,
} from "selectors/editorSelectors";
import { saasEditorDatasourceIdURL } from "ee/RouteBuilder";
import {
  createMessage,
  REST_API_AUTHORIZATION_APPSMITH_ERROR,
  REST_API_AUTHORIZATION_FAILED,
  REST_API_AUTHORIZATION_SUCCESSFUL,
  SAVE_BUTTON_TEXT,
  TEST_DATASOURCE_ERROR,
  TEST_DATASOURCE_SUCCESS,
} from "ee/constants/messages";
import { isDatasourceInViewMode } from "selectors/ui";
import { getQueryParams } from "utils/URLUtils";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import SaveOrDiscardDatasourceModal from "./SaveOrDiscardDatasourceModal";

import { toast, Callout } from "@appsmith/ads";
import styled from "styled-components";
import {
  isDatasourceAuthorizedForQueryCreation,
  isEnabledForPreviewData,
} from "utils/editorContextUtils";
import Debugger, {
  ResizerContentContainer,
  ResizerMainContainer,
} from "./Debugger";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import DatasourceAuth from "pages/common/datasourceAuth";
import {
  getConfigInitialValues,
  getIsFormDirty,
  getTrimmedData,
  isHidden,
  normalizeValues,
  validate,
} from "components/formControls/utils";
import type { ControlProps } from "components/formControls/BaseControl";
import type { ApiDatasourceForm } from "entities/Datasource/RestAPIForm";
import { formValuesToDatasource } from "transformers/RestAPIDatasourceFormTransformer";
import { DSFormHeader } from "./DSFormHeader";
import type { PluginType } from "entities/Action";
import { PluginPackageName } from "entities/Action";
import DSDataFilter from "ee/components/DSDataFilter";
import { DEFAULT_ENV_ID } from "ee/api/ApiUtils";
import { isStorageEnvironmentCreated } from "ee/utils/Environments";
import type { CalloutKind } from "@appsmith/ads";
import type { FeatureFlags } from "ee/entities/FeatureFlag";

import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { setCurrentEditingEnvironmentID } from "ee/actions/environmentAction";
import { getCurrentEnvironmentDetails } from "ee/selectors/environmentSelectors";
import { isGACEnabled } from "ee/utils/planHelpers";
import {
  getHasDeleteDatasourcePermission,
  getHasManageDatasourcePermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import DatasourceTabs from "../DatasourceInfo/DatasorceTabs";
import DatasourceInformation, { ViewModeWrapper } from "./DatasourceSection";
import { convertToPageIdSelector } from "selectors/pageListSelectors";
import { getApplicationByIdFromWorkspaces } from "ee/selectors/applicationSelectors";

interface ReduxStateProps {
  canDeleteDatasource: boolean;
  canManageDatasource: boolean;
  datasourceButtonConfiguration: string[] | undefined;
  datasourceId: string;
  formData: Datasource | ApiDatasourceForm;
  formName: string;
  isSaving: boolean;
  isTesting: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formConfig: any[];
  isDeleting: boolean;
  isNewDatasource: boolean;
  isPluginAuthorized: boolean;
  basePageId: string;
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
  featureFlags?: FeatureFlags;
  isPluginAllowedToPreviewData: boolean;
  isOnboardingFlow?: boolean;
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
    basePageId: string;
  }>;

export const DSEditorWrapper = styled.div`
  height: calc(100vh - ${(props) => props.theme.headerHeight});
  overflow: hidden;
  display: flex;
  flex-direction: row;

  &.onboarding-flow {
    height: 100%;
  }
`;

export const CalloutContainer = styled.div<{
  viewMode: boolean;
}>`
  width: 30vw;
  margin-top: 24px;
  margin-left: ${(props) => (!props.viewMode ? "24px" : "0px")};
`;

export interface DatasourceFilterState {
  id: string;
  name: string;
  userPermissions: string[];
}

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
interface State {
  showDialog: boolean;
  routesBlocked: boolean;
  switchFilterBlocked: boolean;
  readUrlParams: boolean;
  requiredFields: Record<string, ControlProps>;
  configDetails: Record<string, string>;
  filterParams: DatasourceFilterState;

  unblock(): void;
  navigation(): void;
}

export interface DatasourcePaneFunctions {
  switchDatasource: (id: string) => void;
  setDatasourceViewMode: (payload: {
    datasourceId: string;
    viewMode: boolean;
  }) => void;
  setDatasourceViewModeFlag: (viewMode: boolean) => void;
  discardTempDatasource: () => void;
  deleteTempDSFromDraft: () => void;
  toggleSaveActionFlag: (flag: boolean) => void;
  toggleSaveActionFromPopupFlag: (flag: boolean) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reinitializeForm: (formName: string, value: any) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createTempDatasource: (data: any) => void;
  resetDefaultKeyValPairFlag: () => void;
  resetForm: (formName: string) => void;
  initializeFormWithDefaults: (pluginType: string) => void;
  datasourceDiscardAction: (pluginId: string) => void;
  setCurrentEditingEnvironmentID: (id: string) => void;
}

class DatasourceEditorRouter extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showDialog: false,
      routesBlocked: false,
      switchFilterBlocked: false,
      readUrlParams: false,
      requiredFields: {},
      configDetails: {},
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

    // update block state when form becomes dirty/view mode is switched on
    if (
      prevProps.viewMode !== this.props.viewMode &&
      !this.props.viewMode &&
      !!this.props.pluginId
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
      this.props?.match?.params?.datasourceId === TEMP_DATASOURCE_ID
    ) {
      this.props.createTempDatasource({
        pluginId,
      });
    }

    if (!this.props.viewMode && !!this.props.pluginId) {
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
            this.props.setDatasourceViewModeFlag(false);
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

    if (!configProperty || !configProperty.includes(this.getEnvironmentId()))
      return;

    configDetails[configProperty] = controlType;

    if (isRequired) requiredFields[configProperty] = config;

    // if the required fields being rendered has been hidden, then remove them.
    if (this.hasRequiredFieldsChanged()) {
      // derive new states
      const newConfigDetails = { ...configDetails };
      const newRequiredFields = { ...requiredFields };

      Object.keys(requiredFields).forEach((field) => {
        const currentConfig = requiredFields[field];

        if (
          !!field &&
          this.props.formData &&
          this.props.pluginDatasourceForm !==
            DatasourceComponentTypes.RestAPIDatasourceForm &&
          isHidden(
            (this.props.formData as Datasource).datasourceStorages[
              this.getEnvironmentId()
            ],
            currentConfig.hidden,
            this.props?.featureFlags,
            false,
          )
        ) {
          // delete those fields.
          delete newConfigDetails[field];
          delete newRequiredFields[field];
        }
      });

      this.setState({
        configDetails: newConfigDetails,
        requiredFields: newRequiredFields,
      });
    } else {
      this.setState({
        configDetails,
        requiredFields,
      });
    }
  };

  // this method checks if any of the current required fields has been hidden/not rendered.
  //
  hasRequiredFieldsChanged = () => {
    return Object.keys(this.state.requiredFields).some((field) => {
      const currentConfig = this.state.requiredFields[field];

      if (
        !!field &&
        this.props.formData &&
        this.props.pluginDatasourceForm !==
          DatasourceComponentTypes.RestAPIDatasourceForm &&
        isHidden(
          (this.props.formData as Datasource).datasourceStorages[
            this.getEnvironmentId()
          ],
          currentConfig.hidden,
          this.props?.featureFlags,
          false,
        )
      ) {
        return true;
      } else {
        return false;
      }
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  closeDialog() {
    this.setState({ showDialog: false, switchFilterBlocked: false });
  }

  onSave() {
    this.props.toggleSaveActionFromPopupFlag(true);
  }

  onDiscard() {
    this.props.resetForm(this.props.formName);
    this.closeDialogAndUnblockRoutes();

    if (this.state.switchFilterBlocked) {
      //unblock switch filter
      this.setState({ switchFilterBlocked: false });
    } else {
      this.props.discardTempDatasource();
      this.props.deleteTempDSFromDraft();
      this.props.datasourceDiscardAction(this.props?.pluginId);
    }

    this.state.navigation();
    this.props.datasourceDiscardAction(this.props?.pluginId);

    if (!this.props.viewMode && !this.state.switchFilterBlocked) {
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

  resetDefaultKeyValPairFlag() {
    if (
      this.props.defaultKeyValueArrayConfig.length > 0 &&
      !!this.props.initialValue
    ) {
      this.props.resetDefaultKeyValPairFlag();
    }
  }

  updateFilter = (id: string, name: string, userPermissions: string[]) => {
    if (id.length > 0) {
      if (!this.props.viewMode) {
        this.props.setCurrentEditingEnvironmentID(id);
      }

      if (this.state.filterParams.id !== id) {
        if (
          !isEmpty(this.props.formData) &&
          this.props.isFormDirty &&
          this.state.filterParams.id.length > 0
        ) {
          this.setState({
            showDialog: true,
            switchFilterBlocked: true,
            navigation: () => {
              this.updateFilterSuccess(id, name, userPermissions);
            },
          });

          return false;
        } else {
          this.props.resetForm(this.props.formName);
        }

        return this.updateFilterSuccess(id, name, userPermissions);
      } else if (
        !isStorageEnvironmentCreated(this.props.formData as Datasource, id)
      ) {
        return this.updateFilterSuccess(id, name, userPermissions);
      }
    }

    return true;
  };

  updateFilterSuccess = (
    id: string,
    name: string,
    userPermissions: string[],
  ) => {
    const { datasourceStorages } = this.props.datasource as Datasource;
    // check all datasource storages and remove the ones which do not have an id object
    const datasourceStoragesWithId = Object.keys(datasourceStorages).reduce(
      (acc: Record<string, DatasourceStorage>, envId: string) => {
        if (
          datasourceStorages[envId].hasOwnProperty("id") ||
          datasourceStorages[envId].hasOwnProperty("datasourceId")
        ) {
          acc[envId] = datasourceStorages[envId];
        }

        return acc;
      },
      {},
    );
    const initialValues = merge(getConfigInitialValues(this.props.formConfig), {
      properties: [],
    });

    if (!datasourceStoragesWithId.hasOwnProperty(id)) {
      // Create the new datasource storage object
      const newDsStorageObject: DatasourceStorage = {
        datasourceId: this.props.datasourceId,
        environmentId: id,
        isValid: false,
        datasourceConfiguration: initialValues.datasourceConfiguration,
        toastMessage: ToastMessageType.EMPTY_TOAST_MESSAGE,
      };

      // // Add the new datasource storage object to the datasource storages
      this.props.reinitializeForm(this.props.formName, {
        ...this.props.formData,
        datasourceStorages: {
          ...datasourceStoragesWithId,
          [id]: newDsStorageObject,
        },
      });
    } else if (
      !datasourceStoragesWithId[id].hasOwnProperty("datasourceConfiguration")
    ) {
      // Add the new datasource storage object to the datasource storages
      this.props.reinitializeForm(this.props.formName, {
        ...this.props.formData,
        datasourceStorages: {
          ...datasourceStoragesWithId,
          [id]: {
            ...datasourceStoragesWithId[id],
            datasourceConfiguration: initialValues.datasourceConfiguration,
          },
        },
      });
    }

    AnalyticsUtil.logEvent("SWITCH_ENVIRONMENT", {
      fromEnvId: this.state.filterParams.id,
      toEnvId: id,
      fromEnvName: this.state.filterParams.name,
      toEnvName: name,
      mode: "CONFIGURATION",
    });
    // This is the event that changes the filter and updates the datasource
    this.setState({
      filterParams: {
        id,
        name,
        userPermissions,
      },
      configDetails: {},
      requiredFields: {},
    });
    this.blockRoutes();

    return true;
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

  //based on type of toast message, return the message and kind.
  decodeToastMessage(
    messageType: string,
    datasourceName: string,
    environmentId: string | null,
  ): { message: string; kind: string } {
    switch (messageType) {
      case ToastMessageType.TEST_DATASOURCE_ERROR:
        return { message: createMessage(TEST_DATASOURCE_ERROR), kind: "error" };
      case ToastMessageType.TEST_DATASOURCE_SUCCESS:
        return {
          message: createMessage(
            TEST_DATASOURCE_SUCCESS,
            datasourceName,
            environmentId,
          ),
          kind: "success",
        };
      default:
        return { message: "", kind: "" };
    }
  }

  // function to render toast message.
  renderToast() {
    const { datasource, viewMode } = this.props;
    const environmentId = this.getEnvironmentId() || "";
    const path = `datasourceStorages.${environmentId}.toastMessage`;
    const toastMessage = this.decodeToastMessage(
      get(datasource, path),
      (datasource as Datasource).name,
      this.state.filterParams.name,
    );

    if (toastMessage.message)
      return (
        <CalloutContainer viewMode={viewMode}>
          <Callout
            isClosable
            kind={toastMessage.kind as CalloutKind}
            onClose={() => {
              this.props.setDatasourceViewMode({
                datasourceId: this.props.datasourceId,
                viewMode: false,
              });
            }}
          >
            {toastMessage.message}
          </Callout>
        </CalloutContainer>
      );

    return null;
  }

  shouldRenderRestAPIForm = () => {
    const { isInsideReconnectModal, pluginDatasourceForm, viewMode } =
      this.props;

    const shouldViewMode = viewMode && !isInsideReconnectModal;

    // Check for specific form types first
    return (
      pluginDatasourceForm === DatasourceComponentTypes.RestAPIDatasourceForm &&
      !shouldViewMode
    );
  };

  renderForm() {
    const {
      datasource,
      datasourceId,
      featureFlags,
      formConfig,
      formData,
      formName,
      isFormDirty,
      isInsideReconnectModal,
      isSaving,
      location,
      pageId,
      pluginName,
      pluginPackageName,
      pluginType,
      viewMode,
    } = this.props;

    // Check for specific form types first
    if (this.shouldRenderRestAPIForm()) {
      return (
        <>
          <RestAPIDatasourceForm
            applicationId={this.props.applicationId}
            currentEnvironment={this.state.filterParams.id}
            currentEnvironmentName={this.state.filterParams.name}
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
          featureFlags={featureFlags}
          formConfig={formConfig}
          formData={formData}
          formName={DATASOURCE_DB_FORM}
          hiddenHeader={isInsideReconnectModal}
          isPluginAllowedToPreviewData={this.props.isPluginAllowedToPreviewData}
          isSaving={isSaving}
          pageId={pageId}
          pluginType={pluginType}
          setupConfig={this.setupConfig}
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
        this.state.filterParams.id,
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

  renderViewConfigChild = () => {
    const { datasource, formConfig, viewMode } = this.props;

    return (
      <ViewModeWrapper data-testid="t--ds-review-section">
        {!isNil(formConfig) && !isNil(datasource) ? (
          <DatasourceInformation
            config={formConfig[0]}
            datasource={datasource}
            viewMode={viewMode}
          />
        ) : undefined}
      </ViewModeWrapper>
    );
  };

  shouldShowTabs = () => {
    const { isPluginAllowedToPreviewData } = this.props;

    return isPluginAllowedToPreviewData;
  };

  renderTabsForViewMode = () => {
    const { datasource } = this.props;

    return this.shouldShowTabs() ? (
      <DatasourceTabs
        configChild={this.renderViewConfigChild()}
        datasource={datasource as Datasource}
      />
    ) : (
      this.renderViewConfigChild()
    );
  };

  render() {
    const {
      basePageId,
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
      isOnboardingFlow,
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
          basePageId,
          pluginPackageName,
          datasourceId,
        }),
      );

      return null;
    }

    const showingTabsOnViewMode =
      this.shouldShowTabs() && viewMode && !isInsideReconnectModal;

    return (
      <Form
        className="t--json-to-form-wrapper"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {!isInsideReconnectModal && (
          <DSFormHeader
            canDeleteDatasource={canDeleteDatasource}
            canManageDatasource={canManageDatasource}
            datasource={datasource}
            datasourceId={datasourceId}
            isDeleting={isDeleting}
            isNewDatasource={isNewDatasource}
            isPluginAuthorized={isPluginAuthorized}
            noBottomBorder={showingTabsOnViewMode}
            pluginImage={pluginImage}
            pluginName={pluginName}
            pluginType={pluginType}
            setDatasourceViewMode={setDatasourceViewMode}
            viewMode={viewMode}
          />
        )}
        <ResizerMainContainer>
          <ResizerContentContainer
            className={`db-form-resizer-content ${
              showingTabsOnViewMode && "db-form-resizer-content-show-tabs"
            }`}
          >
            <DSEditorWrapper
              className={!!isOnboardingFlow ? "onboarding-flow" : ""}
            >
              {viewMode && !isInsideReconnectModal ? (
                this.renderTabsForViewMode()
              ) : (
                <>
                  <DSDataFilter
                    filterId={this.state.filterParams.id}
                    isInsideReconnectModal={!!isInsideReconnectModal}
                    pluginName={pluginName}
                    pluginType={pluginType}
                    updateFilter={this.updateFilter}
                    viewMode={viewMode}
                  />
                  <div className="db-form-content-container">
                    {this.renderToast()}
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
                        formName={this.props.formName}
                        getSanitizedFormData={memoize(this.getSanitizedData)}
                        isFormDirty={this.props.isFormDirty}
                        isInsideReconnectModal={isInsideReconnectModal}
                        isInvalid={this.validateForm()}
                        isOnboardingFlow={isOnboardingFlow}
                        isSaving={isSaving}
                        isTesting={isTesting}
                        onCancel={() => this.onCancel()}
                        parentEntityId={pageId}
                        pluginName={pluginName}
                        pluginPackageName={pluginPackageName}
                        pluginType={pluginType as PluginType}
                        setDatasourceViewMode={setDatasourceViewMode}
                        triggerSave={triggerSave}
                        viewMode={viewMode}
                      />
                    )}
                  </div>
                </>
              )}
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

    return validate(
      this.state.requiredFields,
      formData,
      this.state.filterParams.id,
    );
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const applicationId = props.applicationId ?? getCurrentApplicationId(state);
  const application = getApplicationByIdFromWorkspaces(state, applicationId);

  const basePageIdFromUrl = props?.match?.params?.basePageId;
  const pageIdFromUrl = convertToPageIdSelector(state, basePageIdFromUrl);
  const pageId = props.pageId || pageIdFromUrl;
  const basePageId =
    application?.pages?.find((page) => page.id === pageId)?.baseId ?? "";

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
  const isNewDatasource = datasourcePane.newDatasource === TEMP_DATASOURCE_ID;
  const pluginDatasourceForm =
    plugin?.datasourceComponent ?? DatasourceComponentTypes.AutoForm;
  const currentEnvDetails = getCurrentEnvironmentDetails(state);
  const isFormDirty = getIsFormDirty(
    isDirty(formName)(state),
    formData,
    isNewDatasource,
    pluginDatasourceForm === DatasourceComponentTypes.RestAPIDatasourceForm,
    currentEnvDetails.editingId,
  );
  const initialValue = getFormInitialValues(formName)(state) as
    | Datasource
    | ApiDatasourceForm;
  const defaultKeyValueArrayConfig =
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    datasourcePane?.defaultKeyValueArrayConfig as any;

  const datasourcePermissions = datasource?.userPermissions || [];

  const featureFlags = selectFeatureFlags(state);
  const isFeatureEnabled = isGACEnabled(featureFlags);

  const canManageDatasource = getHasManageDatasourcePermission(
    isFeatureEnabled,
    datasourcePermissions,
  );

  const canDeleteDatasource = getHasDeleteDatasourcePermission(
    isFeatureEnabled,
    datasourcePermissions,
  );
  // Debugger render flag
  const showDebugger = showDebuggerFlag(state);
  const pluginPackageName = plugin?.packageName ?? "";

  const isPluginAuthorized =
    pluginPackageName === PluginPackageName.GOOGLE_SHEETS
      ? plugin &&
        isDatasourceAuthorizedForQueryCreation(
          formData as Datasource,
          plugin,
          currentEnvDetails.id,
        )
      : true;

  const datasourceButtonConfiguration = getDatasourceFormButtonConfig(
    state,
    pluginId,
  );

  // should plugin be able to preview data
  const isPluginAllowedToPreviewData =
    !!plugin && isEnabledForPreviewData(datasource as Datasource, plugin);

  return {
    canDeleteDatasource,
    canManageDatasource,
    datasourceButtonConfiguration,
    datasourceId,
    pluginImage: getPluginImages(state)[pluginId],
    featureFlags,
    formData,
    formName,
    isInsideReconnectModal: props.isInsideReconnectModal ?? false,
    pluginId,
    isSaving: datasources.loading,
    isDeleting: !!(datasource as Datasource)?.isDeleting,
    isPluginAuthorized: !!isPluginAuthorized,
    isTesting: datasources.isTesting,
    formConfig: formConfigs[pluginId] || [],
    isNewDatasource,
    isPluginAllowedToPreviewData,
    pageId,
    basePageId,
    viewMode,
    pluginType: plugin?.type ?? "",
    pluginName: plugin?.name ?? "",
    pluginDatasourceForm,
    pluginPackageName,
    applicationId,
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ownProps: any,
): DatasourcePaneFunctions => ({
  switchDatasource: (id: string) => {
    // on reconnect data modal, it shouldn't be redirected to datasource edit page
    dispatch(switchDatasource(id, ownProps.isInsideReconnectModal));
  },
  setDatasourceViewMode: (payload: {
    datasourceId: string;
    viewMode: boolean;
  }) => dispatch(setDatasourceViewMode(payload)),
  setDatasourceViewModeFlag: (viewMode: boolean) =>
    dispatch(setDatasourceViewModeFlag(viewMode)),
  discardTempDatasource: () => dispatch(removeTempDatasource()),
  deleteTempDSFromDraft: () => dispatch(deleteTempDSFromDraft()),
  toggleSaveActionFlag: (flag) => dispatch(toggleSaveActionFlag(flag)),
  toggleSaveActionFromPopupFlag: (flag) =>
    dispatch(toggleSaveActionFromPopupFlag(flag)),
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reinitializeForm: (formName: string, value: any) =>
    dispatch(initialize(formName, value, false)),
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createTempDatasource: (data: any) =>
    dispatch(createTempDatasourceFromForm(data)),
  resetForm: (formName: string) => dispatch(reset(formName)),
  resetDefaultKeyValPairFlag: () => dispatch(resetDefaultKeyValPairFlag()),
  initializeFormWithDefaults: (pluginType: string) =>
    dispatch(initializeDatasourceFormDefaults(pluginType)),
  datasourceDiscardAction: (pluginId) =>
    dispatch(datasourceDiscardAction(pluginId)),
  setCurrentEditingEnvironmentID: (id: string) =>
    dispatch(setCurrentEditingEnvironmentID(id)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DatasourceEditorRouter);
