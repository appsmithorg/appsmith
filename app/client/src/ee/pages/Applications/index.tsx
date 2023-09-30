export * from "ce/pages/Applications";
import * as CE_Applications from "ce/pages/Applications";
import { Applications as CE_AppClass } from "ce/pages/Applications";
import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import MediaQuery from "react-responsive";
import { BEBanner } from "./BEBanner";
import {
  isBEBannerVisible,
  shouldShowLicenseBanner,
} from "@appsmith/selectors/tenantSelectors";
import {
  createMessage,
  SEARCH_APPS,
  SEARCH_APPS_AND_PACKAGES,
} from "@appsmith/constants/messages";
import type { AppState } from "@appsmith/reducers";
import { MOBILE_MAX_WIDTH } from "constants/AppConstants";
import SubHeader from "pages/common/SubHeader";
import RepoLimitExceededErrorModal from "pages/Editor/gitSync/RepoLimitExceededErrorModal";
import PageWrapper from "pages/common/PageWrapper";
import { fetchAllPackages } from "@appsmith/actions/packageActions";
import { getShowQueryModule } from "@appsmith/selectors/moduleFeatureSelectors";

export interface EE_ApplicationProps extends CE_Applications.ApplicationProps {
  fetchAllPackages: () => void;
  showBanner: boolean;
  showWarningBanner: boolean;
  showQueryModule: boolean;
}

export type EE_ApplicationState = CE_Applications.ApplicationState;

const UpgradeBannerWrapper = styled.div`
  margin: 0 0 var(--ads-v2-spaces-7);
`;

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
    const searchPlaceholder = this.props.showQueryModule
      ? SEARCH_APPS_AND_PACKAGES
      : SEARCH_APPS;

    return (
      <PageWrapper displayName="Applications">
        <CE_Applications.LeftPane
          isBannerVisible={this.props.showWarningBanner}
        />
        <MediaQuery maxWidth={MOBILE_MAX_WIDTH}>
          {(matches: boolean) => (
            <CE_Applications.ApplicationsWrapper isMobile={matches}>
              {this.props.showBanner && (
                <UpgradeBannerWrapper>
                  <BEBanner isMobile={matches} />
                </UpgradeBannerWrapper>
              )}
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
    showBanner: isBEBannerVisible(state),
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
