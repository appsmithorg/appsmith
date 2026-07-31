import type { ReactNode } from "react";
import React, { useMemo } from "react";
import { Helmet } from "react-helmet";
import styled from "styled-components";
import {
  getPageTitle,
  getHTMLPageTitle,
} from "ee/utils/BusinessFeatures/brandingPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getOrganizationConfig } from "ee/selectors/organizationSelectors";
import { useSelector } from "react-redux";
import { getShouldShowBaseUrlMissingBanner } from "selectors/usersSelectors";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import {
  DESKTOP_BANNER_OFFSET,
  MOBILE_BANNER_OFFSET,
} from "pages/common/bannerOffsets";

export const Wrapper = styled.section<{
  isFixed?: boolean;
  bannerOffset?: number;
}>`
  ${(props) =>
    props.isFixed
      ? `margin: 0;
  position: fixed;
  top: ${props.theme.homePage.header + (props.bannerOffset || 0)}px;
  width: 100%;`
      : `margin-top: ${props.theme.homePage.header + (props.bannerOffset || 0)}px;`}
  && .fade {
    position: relative;
  }
  && .fade-enter {
    opacity: 0;
    z-index: 1;
  }

  && .fade-enter.fade-enter-active {
    opacity: 1;
    transition: opacity 150ms ease-in;
  }
  .fade-exit {
    opacity: 1;
  }
  .fade-exit-active {
    display: none;
    opacity: 0;
  }
`;

export const PageBody = styled.div<{
  isSavable?: boolean;
  bannerOffset?: number;
}>`
  height: calc(
    100vh -
      ${(props) => props.theme.homePage.header + (props.bannerOffset || 0)}px
  );
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  // padding-top: ${(props) => props.theme.spaces[12]}px;
  margin: 0 auto;
  & > * {
    width: 100%;
  }
`;

export interface PageWrapperProps {
  children?: ReactNode;
  displayName?: string;
  isFixed?: boolean;
  isSavable?: boolean;
}

export function PageWrapper(props: PageWrapperProps) {
  const { isFixed = false, isSavable = false } = props;
  const isBrandingEnabled = useFeatureFlag(
    FEATURE_FLAG?.license_branding_enabled,
  );
  const organizationConfig = useSelector(getOrganizationConfig);
  const { instanceName } = organizationConfig;
  const isMobile = useIsMobileDevice();
  // Match PageHeader: when the base-url-missing banner is visible, push content
  // below it for both fixed (Admin Settings) and non-fixed wrappers so consumers
  // do not need to compensate. License-banner pages (e.g. /applications) still
  // apply their own license offset separately.
  const showBaseUrlBanner = useSelector(getShouldShowBaseUrlMissingBanner);
  const bannerOffset = showBaseUrlBanner
    ? isMobile
      ? MOBILE_BANNER_OFFSET
      : DESKTOP_BANNER_OFFSET
    : 0;

  const titleSuffix = useMemo(
    () => getHTMLPageTitle(isBrandingEnabled, instanceName),
    [isBrandingEnabled, instanceName],
  );

  const pageTitle = useMemo(
    () => getPageTitle(isBrandingEnabled, props.displayName, titleSuffix),
    [isBrandingEnabled, props.displayName, titleSuffix],
  );

  return (
    <Wrapper bannerOffset={bannerOffset} isFixed={isFixed}>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      <PageBody bannerOffset={bannerOffset} isSavable={isSavable}>
        {props.children}
      </PageBody>
    </Wrapper>
  );
}

export default PageWrapper;
