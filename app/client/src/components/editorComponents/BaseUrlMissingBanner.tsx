import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Callout } from "@appsmith/ads";
import { getShouldShowBaseUrlMissingBanner } from "selectors/usersSelectors";
import { adminSettingsCategoryUrl } from "ee/RouteBuilder";
import { SettingCategories } from "ee/pages/AdminSettings/config/types";
import {
  BASE_URL_MISSING_BANNER_BODY,
  BASE_URL_MISSING_BANNER_CTA,
  BASE_URL_MISSING_BANNER_TITLE,
  createMessage,
} from "ee/constants/messages";

/**
 * GHSA-j9gf-vw2f-9hrw — admin warning banner shown to instance super-users when
 * the server's SecureBaseUrlResolver reports that APPSMITH_BASE_URL is unset and
 * token-bearing email flows are therefore disabled.
 *
 * Positioned at the very top of the application (rendered above AppHeader in
 * AppRouter), in normal document flow so the rest of the layout pushes down by
 * the banner's height. Not user-dismissible — the banner reflects live server
 * state and clears when the admin sets APPSMITH_BASE_URL via Admin Settings,
 * which triggers the existing Configuration-tier server-restart + SPA-reload
 * flow.
 */
const BannerContainer = styled.div`
  width: 100%;
`;

const BaseUrlMissingBanner: React.FC = () => {
  const shouldShow = useSelector(getShouldShowBaseUrlMissingBanner);

  if (!shouldShow) return null;

  return (
    <BannerContainer data-testid="t--base-url-missing-banner">
      <Callout
        kind="warning"
        links={[
          {
            children: createMessage(BASE_URL_MISSING_BANNER_CTA),
            to: adminSettingsCategoryUrl({
              category: SettingCategories.CONFIGURATION,
            }),
          },
        ]}
      >
        <strong>{createMessage(BASE_URL_MISSING_BANNER_TITLE)}</strong>
        <br />
        <span>{createMessage(BASE_URL_MISSING_BANNER_BODY)}</span>
      </Callout>
    </BannerContainer>
  );
};

export default BaseUrlMissingBanner;
