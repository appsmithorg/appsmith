export * from "ce/pages/Applications";
import * as CE_Applications from "ce/pages/Applications";
import { Applications as CE_AppClass } from "ce/pages/Applications";
import React from "react";
import { connect } from "react-redux";
import { shouldShowLicenseBanner } from "@appsmith/selectors/tenantSelectors";
import type { AppState } from "@appsmith/reducers";
import { fetchAllPackages } from "@appsmith/actions/packageActions";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import CreateNewAppsOption from "@appsmith/pages/Applications/CreateNewAppsOption";

export interface EE_ApplicationProps extends CE_Applications.ApplicationProps {
  fetchAllPackages: () => void;
  showWarningBanner: boolean;
  showQueryModule: boolean;
}

export type EE_ApplicationState = CE_Applications.ApplicationState;

export class Applications extends CE_AppClass<
  EE_ApplicationProps,
  EE_ApplicationState
> {
  constructor(props: EE_ApplicationProps) {
    super(props);
  }

  componentDidMount() {
    super.componentDidMount();
    if (this.props.showQueryModule) {
      this.props.fetchAllPackages();
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
  }

  public render() {
    return this.props.currentApplicationIdForCreateNewApp ? (
      <CreateNewAppsOption
        currentApplicationIdForCreateNewApp={
          this.props.currentApplicationIdForCreateNewApp
        }
        onClickBack={this.props.resetCurrentApplicationIdForCreateNewApp}
      />
    ) : (
      <CE_Applications.ApplictionsMainPage
        searchApplications={this.props.searchApplications}
        searchKeyword={this.props.searchKeyword}
      />
    );
  }
}

const mapStateToProps = (state: AppState) => {
  const CE_mapStateToProps = CE_Applications.mapStateToProps(state);
  return {
    ...CE_mapStateToProps,
    showWarningBanner: shouldShowLicenseBanner(state),
    showQueryModule: getShowQueryModule(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  const CE_mapDispatchToProps = CE_Applications.mapDispatchToProps(dispatch);
  return {
    ...CE_mapDispatchToProps,
    fetchAllPackages: () => dispatch(fetchAllPackages()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Applications);
