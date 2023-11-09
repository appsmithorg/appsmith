import React, { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useRouteMatch } from "react-router-dom";
import { connect, useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import type { AppState } from "@appsmith/reducers";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import {
  AUTH_LOGIN_URL,
  APPLICATIONS_URL,
  matchApplicationPath,
  matchTemplatesPath,
  TEMPLATES_PATH,
  TEMPLATES_ID_PATH,
  matchTemplatesIdPath,
} from "constants/routes";
import history from "utils/history";
import EditorButton from "components/editorComponents/Button";
import ProfileDropdown from "./ProfileDropdown";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import MobileSideBar from "./MobileSidebar";
import { getTemplateNotificationSeenAction } from "actions/templateActions";
import {
  getTenantConfig,
  shouldShowLicenseBanner,
} from "@appsmith/selectors/tenantSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Button } from "design-system";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getCurrentApplication } from "selectors/editorSelectors";
import { get } from "lodash";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { getAssetUrl, isAirgapped } from "@appsmith/utils/airgapHelpers";
import { Banner } from "@appsmith/utils/licenseHelpers";
import { getCurrentApplicationIdForCreateNewApp } from "@appsmith/selectors/applicationSelectors";

const StyledPageHeader = styled(StyledHeader)<{
  hideShadow?: boolean;
  isMobile?: boolean;
  showSeparator?: boolean;
  showingTabs: boolean;
  isBannerVisible?: boolean;
}>`
  justify-content: normal;
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
  ${({ isBannerVisible }) => isBannerVisible && `top: 40px;`};
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;

  .t--appsmith-logo {
    svg {
      max-width: 110px;
      width: 110px;
    }
  }
`;

const Tabs = styled.div`
  display: flex;
  font-size: 14px;
  line-height: 16px;
  box-sizing: border-box;
  margin-left: ${(props) => props.theme.spaces[16]}px;
  height: 100%;
  flex: 1;
`;
const TabsList = styled.div`
  display: flex;
  display: flex;
  gap: var(--ads-v2-spaces-4);
  width: 100%;
  padding: var(--ads-v2-spaces-1) var(--ads-v2-spaces-1) 0
    var(--ads-v2-spaces-1);
`;
const Tab = styled.div<{ isSelected: boolean }>`
  --tab-color: ${(props) =>
    props.isSelected
      ? "var(--ads-v2-color-fg)"
      : "var(--ads-v2-color-fg-muted)"};
  --tab-selection-color: transparent;
  appearance: none;
  position: relative;
  cursor: pointer;
  padding: var(--ads-v2-spaces-2);
  padding-bottom: var(--ads-v2-spaces-3);
  background-color: var(--ads-v2-color-bg);
  border: none; // get rid of button styles
  color: var(--tab-color);
  min-width: fit-content;
  border-radius: var(--ads-v2-border-radius);
  margin-bottom: 2px;
  padding-top: 4px;

  &:after {
    content: "";
    height: 2px;
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    background-color: ${(props) =>
      props.isSelected
        ? `var(--ads-v2-color-border-brand)`
        : `var(--tab-selection-color)`};
  }

  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-3);

  &:hover {
    --tab-selection-color: var(--ads-v2-color-border-emphasis);
  }

  &:focus-visible {
    --tab-color: var(--ads-v2-color-fg);
    outline: var(--ads-v2-border-width-outline) solid
      var(--ads-v2-color-outline);
    outline-offset: var(--ads-v2-offset-outline);
  }
`;

interface PageHeaderProps {
  user?: User;
  hideShadow?: boolean;
  showSeparator?: boolean;
  hideEditProfileLink?: boolean;
}

export function PageHeader(props: PageHeaderProps) {
  const { user } = props;
  const location = useLocation();
  const dispatch = useDispatch();
  const queryParams = new URLSearchParams(location.search);
  const isMobile = useIsMobileDevice();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const tenantConfig = useSelector(getTenantConfig);
  let loginUrl = AUTH_LOGIN_URL;
  if (queryParams.has("redirectUrl")) {
    loginUrl += `?redirectUrl
    =${queryParams.get("redirectUrl")}`;
  }
  const selectedTheme = useSelector(getSelectedAppTheme);
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const navColorStyle =
    currentApplicationDetails?.applicationDetail?.navigationSetting
      ?.colorStyle || NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;
  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );

  const currentApplicationIdForCreateNewApp = useSelector(
    getCurrentApplicationIdForCreateNewApp,
  );

  useEffect(() => {
    dispatch(getTemplateNotificationSeenAction());
  }, []);

  const tabs = [
    {
      title: "Apps",
      path: APPLICATIONS_URL,
      matcher: matchApplicationPath,
    },
    {
      title: "Templates",
      path: TEMPLATES_PATH,
      matcher: matchTemplatesPath,
    },
    {
      title: "Templates id",
      path: TEMPLATES_ID_PATH,
      matcher: matchTemplatesIdPath,
    },
  ];

  const showTabs = useMemo(() => {
    return tabs.some((tab) => tab.matcher(location.pathname));
  }, [location.pathname]);

  const isAirgappedInstance = isAirgapped();
  const showBanner = useSelector(shouldShowLicenseBanner);
  const isHomePage = useRouteMatch("/applications")?.isExact;
  const isLicensePage = useRouteMatch("/license")?.isExact;

  return (
    <>
      <Banner />
      <StyledPageHeader
        data-testid="t--appsmith-page-header"
        hideShadow={props.hideShadow || false}
        isBannerVisible={showBanner && (isHomePage || isLicensePage)}
        isMobile={isMobile}
        showSeparator={props.showSeparator || false}
        showingTabs={showTabs}
      >
        <HeaderSection>
          {tenantConfig.brandLogoUrl && (
            <Link className="t--appsmith-logo" to={APPLICATIONS_URL}>
              <img
                alt="Logo"
                className="h-6"
                src={getAssetUrl(tenantConfig.brandLogoUrl)}
              />
            </Link>
          )}
        </HeaderSection>
        <Tabs>
          {showTabs && !isMobile && !currentApplicationIdForCreateNewApp && (
            <TabsList>
              <Tab
                className="t--apps-tab"
                isSelected={matchApplicationPath(location.pathname)}
                onClick={() => history.push(APPLICATIONS_URL)}
              >
                <div>Apps</div>
              </Tab>

              {!isAirgappedInstance && (
                <Tab
                  className="t--templates-tab"
                  isSelected={
                    matchTemplatesPath(location.pathname) ||
                    matchTemplatesIdPath(location.pathname)
                  }
                  onClick={() => {
                    AnalyticsUtil.logEvent("TEMPLATES_TAB_CLICK");
                    history.push(TEMPLATES_PATH);
                  }}
                >
                  <div>Templates</div>
                </Tab>
              )}
            </TabsList>
          )}
        </Tabs>

        {user && !isMobile && (
          <div>
            {user.username === ANONYMOUS_USERNAME ? (
              <EditorButton
                filled
                intent={"primary"}
                onClick={() => history.push(loginUrl)}
                size="small"
                text="Sign In"
              />
            ) : (
              <ProfileDropdown
                hideEditProfileLink={props.hideEditProfileLink}
                name={user.name}
                navColorStyle={navColorStyle}
                photoId={user?.photoId}
                primaryColor={primaryColor}
                userName={user.username}
              />
            )}
          </div>
        )}
        {isMobile && !isMobileSidebarOpen && (
          <Button
            isIconButton
            kind="tertiary"
            onClick={() => setIsMobileSidebarOpen(true)}
            size={"md"}
            startIcon="hamburger"
          />
        )}
        {isMobile && isMobileSidebarOpen && (
          <Button
            isIconButton
            kind="tertiary"
            onClick={() => setIsMobileSidebarOpen(false)}
            size="sm"
            startIcon="close-x"
          />
        )}
        {isMobile && user && (
          <MobileSideBar
            isOpen={isMobileSidebarOpen}
            name={user.name}
            userName={user.username}
          />
        )}
      </StyledPageHeader>
    </>
  );
}

const mapStateToProps = (state: AppState) => ({
  user: getCurrentUser(state),
  hideShadow: state.ui.theme.hideHeaderShadow,
  showSeparator: state.ui.theme.showHeaderSeparator,
});

export default connect(mapStateToProps)(PageHeader);
