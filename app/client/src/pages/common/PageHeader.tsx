import React, { useEffect } from "react";
import { useRouteMatch } from "react-router-dom";
import { connect, useDispatch, useSelector } from "react-redux";
import {
  getCurrentUser,
  getShouldShowBaseUrlMissingBanner,
} from "selectors/usersSelectors";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import type { DefaultRootState } from "react-redux";
import type { User } from "constants/userConstants";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { getTemplateNotificationSeenAction } from "actions/templateActions";
import { shouldShowLicenseBanner } from "ee/selectors/organizationSelectors";
import { Banner } from "ee/utils/licenseHelpers";
import BaseUrlMissingBanner from "components/editorComponents/BaseUrlMissingBanner";
import bootPylon from "utils/bootPylon";
import EntitySearchBar from "pages/common/SearchBar/EntitySearchBar";

const StyledPageHeader = styled(StyledHeader)<{
  hideShadow?: boolean;
  isMobile?: boolean;
  showSeparator?: boolean;
  isBannerVisible?: boolean;
}>`
  justify-content: space-between;
  background: var(--ads-v2-color-bg);
  height: 48px;
  color: var(--ads-v2-color-bg);
  position: fixed;
  top: 0;
  z-index: var(--ads-v2-z-index-9);
  border-bottom: 1px solid var(--ads-v2-color-border);
  ${({ isMobile }) =>
    isMobile &&
    `
    padding: 0 12px;
    padding-left: 10px;
    `};
  ${({ isBannerVisible, isMobile }) =>
    isBannerVisible ? (isMobile ? `top: 70px;` : `top: 40px;`) : ""};
`;

interface PageHeaderProps {
  user?: User;
  hideShadow?: boolean;
  showSeparator?: boolean;
  hideEditProfileLink?: boolean;
}

export function PageHeader(props: PageHeaderProps) {
  const { user } = props;
  const dispatch = useDispatch();

  const isMobile = useIsMobileDevice();

  useEffect(() => {
    dispatch(getTemplateNotificationSeenAction());
  }, []);

  useEffect(() => {
    bootPylon(user);
  }, [user?.email]);

  const showBanner = useSelector(shouldShowLicenseBanner);
  const isHomePage = useRouteMatch("/applications")?.isExact;
  const isLicensePage = useRouteMatch("/license")?.isExact;
  // GHSA-j9gf-vw2f-9hrw — fold the base-url-missing admin banner into the same
  // isBannerVisible signal that the existing license/trial banner uses, so the
  // page header gets pushed down by the banner's height (40px desktop / 70px
  // mobile) when either banner is visible. Without this, the page header — which
  // has a higher z-index — paints over the fixed-position banner at top: 0.
  const showBaseUrlBanner = useSelector(getShouldShowBaseUrlMissingBanner);
  const isAnyBannerVisible =
    (showBanner && (isHomePage || isLicensePage)) || showBaseUrlBanner;

  return (
    <>
      <Banner />
      <BaseUrlMissingBanner />
      <StyledPageHeader
        data-testid="t--appsmith-page-header"
        hideShadow={props.hideShadow || false}
        isBannerVisible={isAnyBannerVisible}
        isMobile={isMobile}
        showSeparator={props.showSeparator || false}
      >
        <EntitySearchBar user={user} />
      </StyledPageHeader>
    </>
  );
}

const mapStateToProps = (state: DefaultRootState) => ({
  user: getCurrentUser(state),
  hideShadow: state.ui.theme.hideHeaderShadow,
  showSeparator: state.ui.theme.showHeaderSeparator,
});

export default connect(mapStateToProps)(PageHeader);
