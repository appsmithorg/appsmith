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
import { resetEditorRequest } from "actions/initActions";
import { setHeaderMeta } from "actions/themeActions";
import { createMessage, SEARCH_APPS } from "@appsmith/constants/messages";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { AppState } from "@appsmith/reducers";
import { MOBILE_MAX_WIDTH } from "constants/AppConstants";
import SubHeader from "pages/common/SubHeader";
import RepoLimitExceededErrorModal from "pages/Editor/gitSync/RepoLimitExceededErrorModal";
import {
  getIsFetchingApplications,
  getApplicationList,
  getIsCreatingApplication,
  getCreateApplicationError,
  getIsDeletingApplication,
  getIsDuplicatingApplication,
  getUserApplicationsWorkspacesList,
  getApplicationSearchKeyword,
} from "selectors/applicationSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import PageWrapper from "@appsmith/pages/common/PageWrapper";

export interface EE_ApplicationProps extends CE_Applications.ApplicationProps {
  showBanner: boolean;
  showWarningBanner: boolean;
}

export type EE_ApplicationState = CE_Applications.ApplicationState;

const UpgradeBannerWrapper = styled.div`
  margin: 62px 24px 0 16px;
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
  }

  componentWillUnmount() {
    super.componentWillUnmount();
  }

  public render() {
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
                  <BEBanner />
                </UpgradeBannerWrapper>
              )}
              <SubHeader
                isBannerVisible={this.props.showWarningBanner}
                search={{
                  placeholder: createMessage(SEARCH_APPS),
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

const mapStateToProps = (state: AppState) => ({
  applicationList: getApplicationList(state),
  isFetchingApplications: getIsFetchingApplications(state),
  isCreatingApplication: getIsCreatingApplication(state),
  createApplicationError: getCreateApplicationError(state),
  deletingApplication: getIsDeletingApplication(state),
  duplicatingApplication: getIsDuplicatingApplication(state),
  userWorkspaces: getUserApplicationsWorkspacesList(state),
  currentUser: getCurrentUser(state),
  searchKeyword: getApplicationSearchKeyword(state),
  showBanner: isBEBannerVisible(state),
  showWarningBanner: shouldShowLicenseBanner(state),
});

const mapDispatchToProps = (dispatch: any) => ({
  getAllApplication: () => {
    dispatch({ type: ReduxActionTypes.GET_ALL_APPLICATION_INIT });
  },
  resetEditor: () => {
    dispatch(resetEditorRequest());
  },
  searchApplications: (keyword: string) => {
    dispatch({
      type: ReduxActionTypes.SEARCH_APPLICATIONS,
      payload: {
        keyword,
      },
    });
  },
  setHeaderMetaData: (
    hideHeaderShadow: boolean,
    showHeaderSeparator: boolean,
  ) => {
    dispatch(setHeaderMeta(hideHeaderShadow, showHeaderSeparator));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Applications);
