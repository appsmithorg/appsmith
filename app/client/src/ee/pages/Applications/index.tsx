export * from "ce/pages/Applications";
import * as CE_Applications from "ce/pages/Applications";
import { Applications as CE_AppClass } from "ce/pages/Applications";
import React from "react";
import { connect } from "react-redux";
import MediaQuery from "react-responsive";
import { shouldShowLicenseBanner } from "@appsmith/selectors/tenantSelectors";
import {
  createMessage,
  SEARCH_APPS,
  SEARCH_APPS_AND_PACKAGES,
  SEARCH_APPS_AND_WORKFLOWS,
  SEARCH_APPS_PACKAGES_AND_WORKFLOWS,
} from "@appsmith/constants/messages";
import type { AppState } from "@appsmith/reducers";
import { MOBILE_MAX_WIDTH } from "constants/AppConstants";
import SubHeader from "pages/common/SubHeader";
import RepoLimitExceededErrorModal from "pages/Editor/gitSync/RepoLimitExceededErrorModal";
import PageWrapper from "pages/common/PageWrapper";
import { fetchAllPackages } from "@appsmith/actions/packageActions";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";
import { getShowWorkflowFeature } from "@appsmith/selectors/workflowSelectors";
import { fetchAllWorkflows } from "@appsmith/actions/workflowActions";
import CreateNewAppsOption from "@appsmith/pages/Applications/CreateNewAppsOption";

export interface EE_ApplicationProps extends CE_Applications.ApplicationProps {
  fetchAllPackages: () => void;
  fetchAllWorkflows: () => void;
  showWarningBanner: boolean;
  showQueryModule: boolean;
  showWorkflowFeature: boolean;
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

    if (this.props.showWorkflowFeature) {
      this.props.fetchAllWorkflows();
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
  }

  public render() {
    let searchPlaceholder = SEARCH_APPS;
    if (this.props.showQueryModule && this.props.showWorkflowFeature) {
      searchPlaceholder = SEARCH_APPS_PACKAGES_AND_WORKFLOWS;
    } else if (this.props.showQueryModule) {
      searchPlaceholder = SEARCH_APPS_AND_PACKAGES;
    } else if (this.props.showWorkflowFeature) {
      searchPlaceholder = SEARCH_APPS_AND_WORKFLOWS;
    }

    return this.props.currentApplicationIdForCreateNewApp ? (
      <CreateNewAppsOption
        currentApplicationIdForCreateNewApp={
          this.props.currentApplicationIdForCreateNewApp
        }
        onClickBack={this.props.resetCurrentApplicationIdForCreateNewApp}
      />
    ) : (
      <PageWrapper displayName="Applications">
        <CE_Applications.LeftPane
          isBannerVisible={this.props.showWarningBanner}
        />
        <MediaQuery maxWidth={MOBILE_MAX_WIDTH}>
          {(matches: boolean) => (
            <CE_Applications.ApplicationsWrapper isMobile={matches}>
              <SubHeader
                isBannerVisible={this.props.showWarningBanner}
                search={{
                  placeholder: createMessage(searchPlaceholder),
                  queryFn: this.props.searchApplications,
                  defaultValue: this.props.searchKeyword,
                }}
              />
              <CE_Applications.ApplicationsSection
                searchKeyword={this.props.searchKeyword}
              />
              <RepoLimitExceededErrorModal />
            </CE_Applications.ApplicationsWrapper>
          )}
        </MediaQuery>
      </PageWrapper>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  const CE_mapStateToProps = CE_Applications.mapStateToProps(state);
  return {
    ...CE_mapStateToProps,
    showWarningBanner: shouldShowLicenseBanner(state),
    showQueryModule: getShowQueryModule(state),
    showWorkflowFeature: getShowWorkflowFeature(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  const CE_mapDispatchToProps = CE_Applications.mapDispatchToProps(dispatch);
  return {
    ...CE_mapDispatchToProps,
    fetchAllPackages: () => dispatch(fetchAllPackages()),
    fetchAllWorkflows: () => dispatch(fetchAllWorkflows()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Applications);
