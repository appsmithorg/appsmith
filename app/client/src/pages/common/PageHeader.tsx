import React, { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { connect, useDispatch, useSelector } from "react-redux";
import { getCurrentUser, selectFeatureFlags } from "selectors/usersSelectors";
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
import { Colors } from "constants/Colors";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { ReactComponent as TwoLineHamburger } from "assets/icons/ads/two-line-hamburger.svg";
import MobileSideBar from "./MobileSidebar";
import { Indices } from "constants/Layers";
import { getTemplateNotificationSeenAction } from "actions/templateActions";
import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Button } from "design-system";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getCurrentApplication } from "selectors/editorSelectors";
import { get } from "lodash";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { getAssetUrl, isAirgapped } from "@appsmith/utils/airgapHelpers";

const StyledPageHeader = styled(StyledHeader)<{
  hideShadow?: boolean;
  isMobile?: boolean;
  showSeparator?: boolean;
  showingTabs: boolean;
}>`
  box-shadow: none;
  justify-content: normal;
  background: white;
  height: 48px;
  color: white;
  position: fixed;
  top: 0;
  z-index: ${Indices.Layer9};
  box-shadow: 0px 1px 0px ${Colors.GALLERY_2};
  ${({ isMobile }) =>
    isMobile &&
    `
    padding: 0 12px;
    padding-left: 10px;
  `};
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

const StyledDropDownContainer = styled.div``;

const StyledTwoLineHamburger = styled(TwoLineHamburger)`
  fill: ${Colors.BLACK};
  width: 22px;
  height: 22px;
  cursor: pointer;
`;

const Tabs = styled.div`
  display: flex;
  font-size: 16px;
  line-height: 24px;
  box-sizing: border-box;
  margin-left: ${(props) => props.theme.spaces[16]}px;
  height: 100%;
  gap: ${(props) => `${props.theme.spaces[0]}px ${props.theme.spaces[12]}px`};
  flex: 1;
  padding-top: ${(props) => props.theme.spaces[1]}px;
`;
const TabName = styled.div<{ isSelected: boolean }>`
  color: ${Colors.GRAY};
  border-bottom: 2px solid transparent;
  text-align: center;
  display: flex;
  align-items: center;
  ${(props) =>
    props.isSelected &&
    `border-bottom: 2px solid var(--ads-color-brand);
  color: ${Colors.COD_GRAY};`}
  cursor: pointer;
`;

type PageHeaderProps = {
  user?: User;
  hideShadow?: boolean;
  showSeparator?: boolean;
  hideEditProfileLink?: boolean;
};

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

  const featureFlags = useSelector(selectFeatureFlags);

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
  }, [featureFlags, location.pathname]);

  const isAirgappedInstance = isAirgapped();

  return (
    <StyledPageHeader
      data-testid="t--appsmith-page-header"
      hideShadow={props.hideShadow || false}
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
        {showTabs && !isMobile && (
          <>
            <TabName
              className="t--apps-tab"
              isSelected={matchApplicationPath(location.pathname)}
              onClick={() => history.push(APPLICATIONS_URL)}
            >
              <div>Apps</div>
            </TabName>

            {!isAirgappedInstance && (
              <TabName
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
              </TabName>
            )}
          </>
        )}
      </Tabs>

      {user && !isMobile && (
        <StyledDropDownContainer>
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
        </StyledDropDownContainer>
      )}
      {isMobile && !isMobileSidebarOpen && (
        <StyledTwoLineHamburger onClick={() => setIsMobileSidebarOpen(true)} />
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
  );
}

const mapStateToProps = (state: AppState) => ({
  user: getCurrentUser(state),
  hideShadow: state.ui.theme.hideHeaderShadow,
  showSeparator: state.ui.theme.showHeaderSeparator,
});

export default connect(mapStateToProps)(PageHeader);
