import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Banner } from "@appsmith/ads";
import { getShouldShowBaseUrlMissingBanner } from "selectors/usersSelectors";
import { adminSettingsCategoryUrl } from "ee/RouteBuilder";
import { SettingCategories } from "ee/pages/AdminSettings/config/types";
import {
  BASE_URL_MISSING_BANNER_BODY,
  BASE_URL_MISSING_BANNER_CTA,
  createMessage,
} from "ee/constants/messages";

/**
 * GHSA-j9gf-vw2f-9hrw — admin warning banner shown to instance super-users when
 * the server's SecureBaseUrlResolver reports that APPSMITH_BASE_URL is unset and
 * token-bearing email flows are therefore disabled.
 *
 * Uses the same `Banner` ADS component + `position: fixed; top: 0` styling as
 * the existing PageBannerMessage (license/trial banner) — single source of truth
 * for top-of-screen banners across the product. Not user-dismissible: banner
 * reflects live server state and clears on the next bootstrap fetch after the
 * admin sets APPSMITH_BASE_URL via Admin Settings (which triggers the existing
 * Configuration-tier server-restart + SPA-reload flow).
 */
const StyledBanner = styled(Banner)`
  position: fixed;
  z-index: 2;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
`;

const BaseUrlMissingBanner: React.FC = () => {
  const shouldShow = useSelector(getShouldShowBaseUrlMissingBanner);

  if (!shouldShow) return null;

  return (
    <StyledBanner
      data-testid="t--base-url-missing-banner"
      kind="warning"
      link={{
        children: createMessage(BASE_URL_MISSING_BANNER_CTA),
        to: adminSettingsCategoryUrl({
          category: SettingCategories.CONFIGURATION,
        }),
      }}
    >
      {createMessage(BASE_URL_MISSING_BANNER_BODY)}
    </StyledBanner>
  );
};

export default BaseUrlMissingBanner;
