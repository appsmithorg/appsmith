import React from "react";
import { connect } from "react-redux";
import { getFormValues, isDirty } from "redux-form";
import { AppState } from "@appsmith/reducers";
import _ from "lodash";
import {
  getPluginImages,
  getDatasource,
  getPlugin,
} from "selectors/entitiesSelector";
import {
  switchDatasource,
  setDatasourceViewMode,
  removeTempDatasource,
  deleteTempDSFromDraft,
  toggleSaveActionFlag,
  toggleSaveActionFromPopupFlag,
  createTempDatasourceFromForm,
} from "actions/datasourceActions";
import {
  DATASOURCE_DB_FORM,
  DATASOURCE_REST_API_FORM,
} from "@appsmith/constants/forms";
import DataSourceEditorForm from "./DBForm";
import RestAPIDatasourceForm from "./RestAPIDatasourceForm";
import { Datasource } from "entities/Datasource";
import { RouteComponentProps } from "react-router";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import { setGlobalSearchQuery } from "actions/globalSearchActions";
import { toggleShowGlobalSearchModal } from "actions/globalSearchActions";
import { DatasourceComponentTypes } from "api/PluginApi";
import DatasourceSaasForm from "../SaaSEditor/DatasourceForm";

import {
  getCurrentApplicationId,
  selectURLSlugs,
} from "selectors/editorSelectors";
import { saasEditorDatasourceIdURL } from "RouteBuilder";
import {
  createMessage,
  REST_API_AUTHORIZATION_APPSMITH_ERROR,
  REST_API_AUTHORIZATION_FAILED,
  REST_API_AUTHORIZATION_SUCCESSFUL,
} from "@appsmith/constants/messages";
import { Toaster, Variant } from "design-system";
import { isDatasourceInViewMode } from "selectors/ui";
import { getQueryParams } from "utils/URLUtils";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import SaveOrDiscardDatasourceModal from "./SaveOrDiscardDatasourceModal";

interface ReduxStateProps {
  datasourceId: string;
  formData: Datasource;
  isSaving: boolean;
  isTesting: boolean;
  formConfig: any[];
  isDeleting: boolean;
  isNewDatasource: boolean;
  pageId: string;
  pluginImages: Record<string, string>;
  pluginId: string;
  viewMode: boolean;
  pluginType: string;
  pluginDatasourceForm: string;
  pluginPackageName: string;
  applicationId: string;
  applicationSlug: string;
  pageSlug: string;
  fromImporting?: boolean;
  isDatasourceBeingSaved: boolean;
  triggerSave: boolean;
  isFormDirty: boolean;
  datasource: Datasource | undefined;
}

interface DatasourcEditorProps {
  datasourceDeleteTrigger: () => void;
}

type Props = ReduxStateProps &
  DatasourcePaneFunctions &
  DatasourcEditorProps &
  RouteComponentProps<{
    datasourceId: string;
    pageId: string;
  }>;

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
  readUrlParams: boolean;

  unblock(): void;
  navigation(): void;
};

class DataSourceEditor extends React.Component<Props> {
  componentDidUpdate(prevProps: Props) {
    //Fix to prevent restapi datasource from being set in DatasourceDBForm in view mode
    //TODO: Needs cleanup
    if (
      this.props.pluginDatasourceForm !== "RestAPIDatasourceForm" &&
      this.props.datasourceId &&
      this.props.datasourceId !== prevProps.datasourceId
    ) {
      this.props.switchDatasource(this.props.datasourceId);
    }
  }

  componentDidMount() {
    //Fix to prevent restapi datasource from being set in DatasourceDBForm in datasource view mode
    //TODO: Needs cleanup
    if (
      this.props.datasourceId &&
      this.props.pluginDatasourceForm !== "RestAPIDatasourceForm"
    ) {
      this.props.switchDatasource(this.props.datasourceId);
    }

    if (
      this.props.pluginDatasourceForm === "RestAPIDatasourceForm" &&
      this.props.location
    ) {
      const search = new URLSearchParams(this.props.location.search);
      const responseStatus = search.get("response_status");
      const responseMessage = search.get("display_message");
      if (responseStatus) {
        // Set default error message
        let message = REST_API_AUTHORIZATION_FAILED;
        let variant = Variant.danger;
        if (responseStatus === "success") {
          message = REST_API_AUTHORIZATION_SUCCESSFUL;
          variant = Variant.success;
        } else if (responseStatus === "appsmith_error") {
          message = REST_API_AUTHORIZATION_APPSMITH_ERROR;
        }
        Toaster.show({
          text: responseMessage || createMessage(message),
          variant,
        });
      }
    }
  }

  render() {
    const {
      datasourceDeleteTrigger,
      datasourceId,
      formConfig,
      formData,
      fromImporting,
      isDeleting,
      isFormDirty,
      isNewDatasource,
      isSaving,
      isTesting,
      openOmnibarReadMore,
      pageId,
      pluginId,
      pluginImages,
      pluginType,
      setDatasourceViewMode,
      viewMode,
    } = this.props;

    return (
      <DataSourceEditorForm
        applicationId={this.props.applicationId}
        datasourceDeleteTrigger={datasourceDeleteTrigger}
        datasourceId={datasourceId}
        formConfig={formConfig}
        formData={formData}
        formName={DATASOURCE_DB_FORM}
        hiddenHeader={fromImporting}
        isDeleting={isDeleting}
        isFormDirty={isFormDirty}
        isNewDatasource={isNewDatasource}
        isSaving={isSaving}
        isTesting={isTesting}
        openOmnibarReadMore={openOmnibarReadMore}
        pageId={pageId}
        pluginImage={pluginImages[pluginId]}
        pluginType={pluginType}
        setDatasourceViewMode={setDatasourceViewMode}
        viewMode={viewMode && !fromImporting}
      />
    );
  }
}

const mapStateToProps = (state: AppState, props: any): ReduxStateProps => {
  const datasourceId = props.datasourceId ?? props.match?.params?.datasourceId;
  const { datasourcePane } = state.ui;
  const { datasources, plugins } = state.entities;
  const viewMode = isDatasourceInViewMode(state);
  const datasource = getDatasource(state, datasourceId);
  const { formConfigs } = plugins;
  const formData = getFormValues(DATASOURCE_DB_FORM)(state) as Datasource;
  const pluginId = _.get(datasource, "pluginId", "");
  const plugin = getPlugin(state, pluginId);
  const { applicationSlug, pageSlug } = selectURLSlugs(state);
  const formName =
    plugin?.type === "API" ? DATASOURCE_REST_API_FORM : DATASOURCE_DB_FORM;
  // for plugins, where 1 default endpoint is initialized,
  // added this check so that form isnt considered dirty with default endpoint
  const defaultEndpoints: Array<{
    host: string;
    port: string;
  }> = (formData?.datasourceConfiguration as any)?.endpoints || [];
  const isDefaultEndpoint =
    defaultEndpoints.length === 1 &&
    defaultEndpoints[0].host === "" &&
    defaultEndpoints[0].port === "";
  const isFormDirty =
    datasourceId === TEMP_DATASOURCE_ID
      ? true
      : isDirty(formName)(state) && !isDefaultEndpoint;

  return {
    datasourceId,
    pluginImages: getPluginImages(state),
    formData,
    fromImporting: props.fromImporting ?? false,
    pluginId,
    isSaving: datasources.loading,
    isDeleting: !!datasource?.isDeleting,
    isTesting: datasources.isTesting,
    formConfig: formConfigs[pluginId] || [],
    isNewDatasource: datasourcePane.newDatasource === TEMP_DATASOURCE_ID,
    pageId: props.pageId ?? props.match?.params?.pageId,
    viewMode: viewMode ?? !props.fromImporting,
    pluginType: plugin?.type ?? "",
    pluginDatasourceForm:
      plugin?.datasourceComponent ?? DatasourceComponentTypes.AutoForm,
    pluginPackageName: plugin?.packageName ?? "",
    applicationId: props.applicationId ?? getCurrentApplicationId(state),
    applicationSlug,
    pageSlug,
    isDatasourceBeingSaved: datasources.isDatasourceBeingSaved,
    triggerSave: datasources.isDatasourceBeingSavedFromPopup,
    isFormDirty,
    datasource,
  };
};

const mapDispatchToProps = (
  dispatch: any,
  ownProps: any,
): DatasourcePaneFunctions => ({
  switchDatasource: (id: string) => {
    // on reconnect data modal, it shouldn't be redirected to datasource edit page
    dispatch(switchDatasource(id, ownProps.fromImporting));
  },
  setDatasourceViewMode: (viewMode: boolean) =>
    dispatch(setDatasourceViewMode(viewMode)),
  openOmnibarReadMore: (text: string) => {
    dispatch(setGlobalSearchQuery(text));
    dispatch(toggleShowGlobalSearchModal());
  },
  discardTempDatasource: () => dispatch(removeTempDatasource()),
  deleteTempDSFromDraft: () => dispatch(deleteTempDSFromDraft()),
  toggleSaveActionFlag: (flag) => dispatch(toggleSaveActionFlag(flag)),
  toggleSaveActionFromPopupFlag: (flag) =>
    dispatch(toggleSaveActionFromPopupFlag(flag)),
  createTempDatasource: (data: any) =>
    dispatch(createTempDatasourceFromForm(data)),
});

export interface DatasourcePaneFunctions {
  switchDatasource: (id: string) => void;
  setDatasourceViewMode: (viewMode: boolean) => void;
  openOmnibarReadMore: (text: string) => void;
  discardTempDatasource: () => void;
  deleteTempDSFromDraft: () => void;
  toggleSaveActionFlag: (flag: boolean) => void;
  toggleSaveActionFromPopupFlag: (flag: boolean) => void;
  createTempDatasource: (data: any) => void;
}

class DatasourceEditorRouter extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showDialog: false,
      routesBlocked: false,
      readUrlParams: false,
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
    this.setViewModeFromQueryParams();
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

    if (
      this.props.pluginDatasourceForm ===
      DatasourceComponentTypes.RestAPIDatasourceForm
    ) {
      this.setViewModeFromQueryParams();
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

  componentWillUnmount() {
    this.props.discardTempDatasource();
    this.props.deleteTempDSFromDraft();
    !!this.state.unblock && this.state.unblock();
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

  renderSaveDisacardModal() {
    return (
      <SaveOrDiscardDatasourceModal
        datasourceId={this.props.datasourceId}
        datasourcePermissions={this.props.datasource?.userPermissions || []}
        isOpen={this.state.showDialog}
        onClose={this.closeDialog}
        onDiscard={this.onDiscard}
        onSave={this.onSave}
      />
    );
  }
  render() {
    const {
      datasourceId,
      fromImporting,
      history,
      isDeleting,
      isFormDirty,
      isNewDatasource,
      isSaving,
      location,
      pageId,
      pluginDatasourceForm,
      pluginId,
      pluginImages,
      pluginPackageName,
      pluginType,
      viewMode,
    } = this.props;

    if (!pluginId && datasourceId) {
      return <EntityNotFoundPane />;
    }

    const shouldViewMode = viewMode && !fromImporting;
    // Check for specific form types first
    if (pluginDatasourceForm === "RestAPIDatasourceForm" && !shouldViewMode) {
      return (
        <>
          <RestAPIDatasourceForm
            applicationId={this.props.applicationId}
            datasourceDeleteTrigger={this.datasourceDeleteTrigger}
            datasourceId={datasourceId}
            hiddenHeader={fromImporting}
            isDeleting={isDeleting}
            isFormDirty={isFormDirty}
            isNewDatasource={isNewDatasource}
            isSaving={isSaving}
            location={location}
            pageId={pageId}
            pluginImage={pluginImages[pluginId]}
            triggerSave={this.props.triggerSave}
          />
          {this.renderSaveDisacardModal()}
        </>
      );
    }
    // for saas form
    if (pluginType === "SAAS") {
      // todo check if we can remove the flag here
      if (fromImporting) {
        return (
          <DatasourceSaasForm
            datasourceId={datasourceId}
            hiddenHeader
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

    // Default to old flow
    // Todo: later refactor to make this "AutoForm"
    return (
      <>
        <DataSourceEditor
          {...this.props}
          datasourceDeleteTrigger={this.datasourceDeleteTrigger}
          datasourceId={datasourceId}
          pageId={pageId}
        />
        {this.renderSaveDisacardModal()}
      </>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DatasourceEditorRouter);
