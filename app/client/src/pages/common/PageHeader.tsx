import React, { useEffect } from "react";
import { connect, useDispatch } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import type { DefaultRootState } from "react-redux";
import type { User } from "constants/userConstants";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { getTemplateNotificationSeenAction } from "actions/templateActions";
import { Banner } from "ee/utils/licenseHelpers";
import BaseUrlMissingBanner from "components/editorComponents/BaseUrlMissingBanner";
import bootPylon from "utils/bootPylon";
import EntitySearchBar from "pages/common/SearchBar/EntitySearchBar";
import {
  DESKTOP_BANNER_OFFSET,
  MOBILE_BANNER_OFFSET,
} from "pages/common/bannerOffsets";
import { useIsBannerVisible } from "pages/common/useIsBannerVisible";

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
    isBannerVisible
      ? isMobile
        ? `top: ${MOBILE_BANNER_OFFSET}px;`
        : `top: ${DESKTOP_BANNER_OFFSET}px;`
      : ""};
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

  // APP-16059 / GHSA-j9gf-vw2f-9hrw — single source of truth for whether a
  // top-of-screen banner is visible (the license/trial banner on the home and
  // /license routes, or the global base-url-missing admin banner). When it is,
  // the fixed page header is pushed down by DESKTOP_BANNER_OFFSET /
  // MOBILE_BANNER_OFFSET instead of painting over the banner at top: 0.
  const isAnyBannerVisible = useIsBannerVisible();

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
