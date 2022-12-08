import React from "react";
import styled from "styled-components";
import _, { merge } from "lodash";
import { DATASOURCE_SAAS_FORM } from "@appsmith/constants/forms";
import FormTitle from "pages/Editor/DataSourceEditor/FormTitle";
import { Button as AdsButton, Category } from "design-system";
import { Datasource } from "entities/Datasource";
import {
  getFormValues,
  InjectedFormProps,
  isDirty,
  reduxForm,
} from "redux-form";
import { RouteComponentProps } from "react-router";
import { connect } from "react-redux";
import { AppState } from "@appsmith/reducers";
import {
  getDatasource,
  getPluginImages,
  getDatasourceFormButtonConfig,
} from "selectors/entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import {
  FormTitleContainer,
  Header,
  JSONtoForm,
  JSONtoFormProps,
  PluginImage,
} from "../DataSourceEditor/JSONtoForm";
import { getConfigInitialValues } from "components/formControls/utils";
import Connected from "../DataSourceEditor/Connected";
import { Colors } from "constants/Colors";

import { getCurrentApplicationId } from "selectors/editorSelectors";
import DatasourceAuth from "../../common/datasourceAuth";
import EntityNotFoundPane from "../EntityNotFoundPane";
import { saasEditorDatasourceIdURL } from "RouteBuilder";
import { isDatasourceInViewMode } from "selectors/ui";
import { hasManageDatasourcePermission } from "@appsmith/utils/permissionHelpers";
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

interface StateProps extends JSONtoFormProps {
  applicationId: string;
  canManageDatasource?: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  loadingFormConfigs: boolean;
  isNewDatasource: boolean;
  pluginImage: string;
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

const EditDatasourceButton = styled(AdsButton)`
  padding: 10px 20px;
  &&&& {
    height: 32px;
    max-width: 160px;
    border: 1px solid ${Colors.HIT_GRAY};
    width: auto;
  }
`;

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
      canManageDatasource,
      datasource,
      datasourceButtonConfiguration,
      datasourceId,
      formData,
      hiddenHeader,
      pageId,
      pluginPackageName,
    } = this.props;
    const params: string = location.search;
    const viewMode =
      !hiddenHeader && new URLSearchParams(params).get("viewMode");

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
              )}
            </Header>
          )}
          {(!viewMode || datasourceId === TEMP_DATASOURCE_ID) && (
            <>
              {!_.isNil(sections)
                ? _.map(sections, this.renderMainSection)
                : null}
              {""}
            </>
          )}
          {viewMode && <Connected />}
          {/* Render datasource form call-to-actions */}
          {datasource && (
            <DatasourceAuth
              datasource={datasource}
              datasourceButtonConfiguration={datasourceButtonConfiguration}
              datasourceDeleteTrigger={this.datasourceDeleteTrigger}
              formData={formData}
              getSanitizedFormData={_.memoize(this.getSanitizedData)}
              isInvalid={this.validate()}
              pageId={pageId}
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

  const datsourcePermissions = datasource?.userPermissions || [];

  const canManageDatasource = hasManageDatasourcePermission(
    datsourcePermissions,
  );

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
