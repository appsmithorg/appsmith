import React from "react";
import _, { merge } from "lodash";
import { DATASOURCE_SAAS_FORM } from "@appsmith/constants/forms";
import FormTitle from "pages/Editor/DataSourceEditor/FormTitle";
import { Category } from "design-system-old";
import type { Datasource } from "entities/Datasource";
import type { InjectedFormProps } from "redux-form";
import { getFormValues, isDirty, reduxForm } from "redux-form";
import type { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import {
  getDatasource,
  getPluginImages,
  getDatasourceFormButtonConfig,
  getPlugin,
} from "selectors/entitiesSelector";
import type { ActionDataState } from "reducers/entityReducers/actionsReducer";
import type { JSONtoFormProps } from "../DataSourceEditor/JSONtoForm";
import {
  ActionWrapper,
  EditDatasourceButton,
  FormTitleContainer,
  Header,
  JSONtoForm,
  PluginImage,
} from "../DataSourceEditor/JSONtoForm";
import { getConfigInitialValues } from "components/formControls/utils";
import Connected from "../DataSourceEditor/Connected";

import {
  getCurrentApplicationId,
  getGsheetProjectID,
  getGsheetToken,
  getPagePermissions,
} from "selectors/editorSelectors";
import DatasourceAuth from "pages/common/datasourceAuth";
import EntityNotFoundPane from "../EntityNotFoundPane";
import { saasEditorDatasourceIdURL } from "RouteBuilder";
import NewActionButton from "../DataSourceEditor/NewActionButton";
import type { Plugin } from "api/PluginApi";
import { isDatasourceAuthorizedForQueryCreation } from "utils/editorContextUtils";
import { PluginPackageName } from "entities/Action";
import AuthMessage from "pages/common/datasourceAuth/AuthMessage";
import { isDatasourceInViewMode } from "selectors/ui";
import {
  hasCreateDatasourceActionPermission,
  hasManageDatasourcePermission,
} from "@appsmith/utils/permissionHelpers";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import {
  createTempDatasourceFromForm,
  deleteTempDSFromDraft,
  removeTempDatasource,
  setDatasourceViewMode,
  toggleSaveActionFlag,
  toggleSaveActionFromPopupFlag,
} from "actions/datasourceActions";
import SaveOrDiscardDatasourceModal from "../DataSourceEditor/SaveOrDiscardDatasourceModal";
import {
  GSHEET_AUTHORIZATION_ERROR,
  createMessage,
  SAVE_AND_AUTHORIZE_BUTTON_TEXT,
} from "ce/constants/messages";
import { selectFeatureFlags } from "selectors/usersSelectors";

interface StateProps extends JSONtoFormProps {
  applicationId: string;
  canManageDatasource?: boolean;
  canCreateDatasourceActions?: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  loadingFormConfigs: boolean;
  isNewDatasource: boolean;
  pluginImage: string;
  plugin?: Plugin;
  pluginId: string;
  actions: ActionDataState;
  datasource?: Datasource;
  datasourceButtonConfiguration: string[] | undefined;
  hiddenHeader?: boolean; // for reconnect modal
  pageId?: string; // for reconnect modal
  pluginPackageName: string; // for reconnect modal
  datasourceName: string;
  viewMode: boolean;
  isDatasourceBeingSaved: boolean;
  isDatasourceBeingSavedFromPopup: boolean;
  isFormDirty: boolean;
  gsheetToken?: string;
  gsheetProjectID?: string;
}
interface DatasourceFormFunctions {
  discardTempDatasource: () => void;
  deleteTempDSFromDraft: () => void;
  toggleSaveActionFlag: (flag: boolean) => void;
  toggleSaveActionFromPopupFlag: (flag: boolean) => void;
  createTempDatasource: (data: any) => void;
  setDatasourceViewMode: (viewMode: boolean) => void;
}

type DatasourceSaaSEditorProps = StateProps &
  DatasourceFormFunctions &
  RouteComponentProps<{
    datasourceId: string;
    pageId: string;
    pluginPackageName: string;
  }>;

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
    // update block state when form becomes dirty/view mode is switched on
    if (prevProps.viewMode !== this.props.viewMode && !this.props.viewMode) {
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
    // Create Temp Datasource on component mount,
    // if user hasnt saved datasource for the first time and refreshed the page
    if (
      !this.props.datasource &&
      this.props.match.params.datasourceId === TEMP_DATASOURCE_ID
    ) {
      const urlObject = new URL(window.location.href);
      const pluginId = urlObject?.searchParams.get("pluginId");
      this.props.createTempDatasource({
        pluginId,
      });
    }
    if (!this.props.viewMode) {
      this.blockRoutes();
    }
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
      ...this.normalizeValues(),
      name: this.props.datasourceName,
    };
  };

  renderDataSourceConfigForm = (sections: any) => {
    const {
      canCreateDatasourceActions,
      canManageDatasource,
      datasource,
      datasourceButtonConfiguration,
      datasourceId,
      formData,
      gsheetProjectID,
      gsheetToken,
      hiddenHeader,
      pageId,
      plugin,
      pluginPackageName,
    } = this.props;
    const params: string = location.search;
    const viewMode =
      !hiddenHeader && new URLSearchParams(params).get("viewMode");

    /* 
      TODO: This flag will be removed once the multiple environment is merged to avoid design inconsistency between different datasources.
      Search for: GoogleSheetPluginFlag to check for all the google sheet conditional logic throughout the code.
    */
    const isGoogleSheetPlugin =
      plugin?.packageName === PluginPackageName.GOOGLE_SHEETS;

    const isPluginAuthorized =
      plugin && isDatasourceAuthorizedForQueryCreation(formData, plugin);

    const createFlow = datasourceId === TEMP_DATASOURCE_ID;

    return (
      <>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          {!hiddenHeader && (
            <Header>
              <FormTitleContainer>
                <PluginImage alt="Datasource" src={this.props.pluginImage} />
                <FormTitle
                  disabled={!createFlow && !canManageDatasource}
                  focusOnMount={this.props.isNewDatasource}
                />
              </FormTitleContainer>

              {viewMode && (
                <ActionWrapper>
                  <EditDatasourceButton
                    category={Category.secondary}
                    className="t--edit-datasource"
                    onClick={() => {
                      this.props.setDatasourceViewMode(false);
                      this.props.history.replace(
                        saasEditorDatasourceIdURL({
                          pageId: pageId || "",
                          pluginPackageName,
                          datasourceId,
                          params: {
                            viewMode: false,
                          },
                        }),
                      );
                    }}
                    text="EDIT"
                  />
                  {isGoogleSheetPlugin && (
                    <NewActionButton
                      datasource={datasource}
                      disabled={
                        !canCreateDatasourceActions || !isPluginAuthorized
                      }
                      eventFrom="datasource-pane"
                      plugin={plugin}
                      style={{
                        marginLeft: "16px",
                      }}
                    />
                  )}
                </ActionWrapper>
              )}
            </Header>
          )}
          {(!viewMode || datasourceId === TEMP_DATASOURCE_ID) && (
            <>
              {datasource && isGoogleSheetPlugin && !isPluginAuthorized ? (
                <AuthMessage
                  datasource={datasource}
                  description={GSHEET_AUTHORIZATION_ERROR}
                  pageId={pageId}
                  style={{
                    paddingTop: "24px",
                  }}
                />
              ) : null}
              {!_.isNil(sections)
                ? _.map(sections, this.renderMainSection)
                : null}
              {""}
            </>
          )}
          {viewMode && (
            <Connected
              errorComponent={
                datasource && isGoogleSheetPlugin && !isPluginAuthorized ? (
                  <AuthMessage
                    actionType="authorize"
                    datasource={datasource}
                    description={GSHEET_AUTHORIZATION_ERROR}
                    pageId={pageId}
                  />
                ) : null
              }
              showDatasourceSavedText={!isGoogleSheetPlugin}
            />
          )}
          {/* Render datasource form call-to-actions */}
          {datasource && (
            <DatasourceAuth
              datasource={datasource}
              datasourceButtonConfiguration={datasourceButtonConfiguration}
              datasourceDeleteTrigger={this.datasourceDeleteTrigger}
              formData={formData}
              getSanitizedFormData={_.memoize(this.getSanitizedData)}
              gsheetProjectID={gsheetProjectID}
              gsheetToken={gsheetToken}
              isInvalid={this.validate()}
              pageId={pageId}
              shouldDisplayAuthMessage={!isGoogleSheetPlugin}
              shouldRender={!viewMode}
              triggerSave={this.props.isDatasourceBeingSavedFromPopup}
            />
          )}
        </form>
        <SaveOrDiscardDatasourceModal
          datasourceId={datasourceId}
          datasourcePermissions={datasource?.userPermissions || []}
          isOpen={this.state.showDialog}
          onClose={this.closeDialog}
          onDiscard={this.onDiscard}
          onSave={this.onSave}
          saveButtonText={createMessage(SAVE_AND_AUTHORIZE_BUTTON_TEXT)}
        />
      </>
    );
  };
}

const mapStateToProps = (state: AppState, props: any) => {
  const datasourceId = props.datasourceId || props.match?.params?.datasourceId;
  const { datasourcePane } = state.ui;
  const { datasources, plugins } = state.entities;
  const viewMode = isDatasourceInViewMode(state);
  const datasource = getDatasource(state, datasourceId);
  const { formConfigs } = plugins;
  const formData = getFormValues(DATASOURCE_SAAS_FORM)(state) as Datasource;
  const pluginId = _.get(datasource, "pluginId", "");
  const plugin = getPlugin(state, pluginId);
  const formConfig = formConfigs[pluginId];
  const initialValues = {};
  if (formConfig) {
    merge(initialValues, getConfigInitialValues(formConfig));
  }
  merge(initialValues, datasource);

  const datasourceButtonConfiguration = getDatasourceFormButtonConfig(
    state,
    formData?.pluginId,
  );
  const isFormDirty =
    datasourceId === TEMP_DATASOURCE_ID
      ? true
      : isDirty(DATASOURCE_SAAS_FORM)(state);

  const datasourcePermissions = datasource?.userPermissions || [];

  const canManageDatasource = hasManageDatasourcePermission(
    datasourcePermissions,
  );

  const pagePermissions = getPagePermissions(state);
  const canCreateDatasourceActions = hasCreateDatasourceActionPermission([
    ...datasourcePermissions,
    ...pagePermissions,
  ]);

  const gsheetToken = getGsheetToken(state);
  const gsheetProjectID = getGsheetProjectID(state);

  return {
    datasource,
    datasourceButtonConfiguration,
    datasourceId,
    isSaving: datasources.loading,
    isDeleting: !!datasource?.isDeleting,
    formData: formData,
    formConfig,
    viewMode: viewMode ?? !props.fromImporting,
    isNewDatasource: datasourcePane.newDatasource === TEMP_DATASOURCE_ID,
    pageId: props.pageId || props.match?.params?.pageId,
    plugin: plugin,
    pluginImage: getPluginImages(state)[pluginId],
    pluginPackageName:
      props.pluginPackageName || props.match?.params?.pluginPackageName,
    initialValues,
    pluginId: pluginId,
    actions: state.entities.actions,
    formName: DATASOURCE_SAAS_FORM,
    applicationId: getCurrentApplicationId(state),
    canManageDatasource: canManageDatasource,
    datasourceName: datasource?.name ?? "",
    isDatasourceBeingSaved: datasources.isDatasourceBeingSaved,
    isDatasourceBeingSavedFromPopup:
      state.entities.datasources.isDatasourceBeingSavedFromPopup,
    isFormDirty,
    canCreateDatasourceActions,
    featureFlags: selectFeatureFlags(state),
    gsheetToken,
    gsheetProjectID,
  };
};

const mapDispatchToProps = (dispatch: any): DatasourceFormFunctions => ({
  discardTempDatasource: () => dispatch(removeTempDatasource()),
  deleteTempDSFromDraft: () => dispatch(deleteTempDSFromDraft()),
  toggleSaveActionFlag: (flag) => dispatch(toggleSaveActionFlag(flag)),
  toggleSaveActionFromPopupFlag: (flag) =>
    dispatch(toggleSaveActionFromPopupFlag(flag)),
  setDatasourceViewMode: (viewMode: boolean) =>
    dispatch(setDatasourceViewMode(viewMode)),
  createTempDatasource: (data: any) =>
    dispatch(createTempDatasourceFromForm(data)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  reduxForm<Datasource, DatasourceSaaSEditorProps>({
    form: DATASOURCE_SAAS_FORM,
    enableReinitialize: true,
  })(DatasourceSaaSEditor),
);
