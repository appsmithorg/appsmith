import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { NavigationSetting } from "constants/AppConstants";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import styled from "styled-components";
import classNames from "classnames";
import {
  getAppMode,
  getCurrentApplication,
} from "ee/selectors/applicationSelectors";
import type { ApplicationPayload } from "entities/Application";
import {
  getCurrentPageId,
  getViewModePageList,
} from "selectors/editorSelectors";
import { useHref } from "pages/Editor/utils";
import { APP_MODE } from "entities/App";
import { builderURL, viewerURL } from "ee/RouteBuilder";
import { get } from "lodash";
import { getAssetUrl } from "ee/utils/airgapHelpers";

interface NavigationLogoProps {
  logoConfiguration: NavigationSetting["logoConfiguration"];
}

const StyledImage = styled.img`
  max-width: 10rem;
  max-height: 1.5rem;
`;

function NavigationLogo(props: NavigationLogoProps) {
  const { logoConfiguration } = props;
  const currentApplicationDetails: ApplicationPayload | undefined = useSelector(
    getCurrentApplication,
  );
  const pages = useSelector(getViewModePageList);
  const appMode = useSelector(getAppMode);
  const defaultPage = pages.find((page) => page.isDefault) || pages[0];
  const pageUrl = useHref(
    appMode === APP_MODE.PUBLISHED ? viewerURL : builderURL,
    {
      basePageId: defaultPage?.basePageId,
    },
  );
  const logoAssetId = get(
    currentApplicationDetails,
    "applicationDetail.navigationSetting.logoAssetId",
    "",
  );
  const currentPageId = useSelector(getCurrentPageId);

  if (
    !logoAssetId?.length ||
    logoConfiguration ===
      NAVIGATION_SETTINGS.LOGO_CONFIGURATION.APPLICATION_TITLE_ONLY ||
    logoConfiguration ===
      NAVIGATION_SETTINGS.LOGO_CONFIGURATION.NO_LOGO_OR_APPLICATION_TITLE
  ) {
    return null;
  }

  return (
    <Link
      className={classNames({
        "mr-4": true,
        "pointer-events-none select-none":
          pages.length <= 1 || defaultPage.pageId === currentPageId,
      })}
      to={pageUrl}
    >
      <StyledImage
        alt="Application's logo"
        src={getAssetUrl(`/api/v1/assets/${logoAssetId}`)}
      />
    </Link>
  );
}

export default NavigationLogo;
