import React, { useState, useEffect } from "react";
import { Link, useLocation, useRouteMatch } from "react-router-dom";
import { connect, useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import type { AppState } from "@appsmith/reducers";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { AUTH_LOGIN_URL, APPLICATIONS_URL } from "constants/routes";
import history from "utils/history";
import EditorButton from "components/editorComponents/Button";
import ProfileDropdown from "./ProfileDropdown";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import MobileSideBar from "./MobileSidebar";
import { getTemplateNotificationSeenAction } from "actions/templateActions";
import {
  getTenantConfig,
  getTenantPermissions,
  shouldShowLicenseBanner,
} from "@appsmith/selectors/tenantSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  Button,
  Icon,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  SearchInput,
  Text,
} from "design-system";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { getCurrentApplication } from "selectors/editorSelectors";
import { get, noop } from "lodash";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { getAssetUrl, isAirgapped } from "@appsmith/utils/airgapHelpers";
import { Banner, ShowUpgradeMenuItem } from "@appsmith/utils/licenseHelpers";
import {
  getCurrentApplicationIdForCreateNewApp,
  getSearchedApplications,
  getSearchedWorkspaces,
} from "@appsmith/selectors/applicationSelectors";
import {
  getAdminSettingsPath,
  getShowAdminSettings,
} from "@appsmith/utils/BusinessFeatures/adminSettingsHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  DropdownOnSelectActions,
  getOnSelectAction,
} from "./CustomizedDropdown/dropdownHelpers";
import {
  APPSMITH_DISPLAY_VERSION,
  DOCUMENTATION,
  JOIN_OUR_DISCORD,
  TRY_GUIDED_TOUR,
  WHATS_NEW,
  createMessage,
} from "@appsmith/constants/messages";
import { getOnboardingWorkspaces } from "selectors/onboardingSelectors";
import { onboardingCreateApplication } from "actions/onboardingActions";
import { DISCORD_URL, DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import ProductUpdatesModal from "pages/Applications/ProductUpdatesModal";
import { getAppsmithConfigs } from "@appsmith/configs";
import { howMuchTimeBeforeText } from "utils/helpers";
import { searchEntities } from "@appsmith/actions/applicationActions";
import { getIsFetchingApplications } from "@appsmith/selectors/selectedWorkspaceSelectors";
import type { Workspace } from "@appsmith/constants/workspaceConstants";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import { debounce } from "lodash";

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

const SearchContainer = styled.div<{ isMobile?: boolean }>`
  width: ${({ isMobile }) => (isMobile ? `100%` : `350px`)};
  position: relative;
`;
const SearchListContainer = styled.div`
  width: 350px;
  max-height: 420px;
  position: absolute;
  top: 30px;
  left: 0;
  border-radius: 4px;
  box-shadow: 0 1px 20px 0 rgba(76, 86, 100, 0.11);
  border: solid 1px var(--ads-v2-color-bg-muted);
  background-color: var(--ads-v2-color-bg);
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow-y: auto;
`;

const SearchListItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  &:hover {
    background-color: var(--ads-v2-color-bg-muted);
    border-radius: 4px;
  }
`;

export const VersionData = styled.div`
  display: flex;
  color: var(--ads-v2-color-fg-muted);
  font-size: 8px;
  position: relative;
  padding: 6px 12px 12px;
  gap: 8px;
  span {
    width: 50%;
  }
`;

const MobileSearchInput = styled(SearchInput)`
  span {
    display: none;
  }
  input {
    border: none !important;
    padding: 0 0 0 4px !important;
  }
`;

interface PageHeaderProps {
  user?: User;
  hideShadow?: boolean;
  showSeparator?: boolean;
  hideEditProfileLink?: boolean;
}

const HomepageHeaderAction = ({
  setIsProductUpdatesModalOpen,
  user,
}: {
  user: User;
  setIsProductUpdatesModalOpen: (val: boolean) => void;
}) => {
  const dispatch = useDispatch();
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const tenantPermissions = useSelector(getTenantPermissions);
  const onboardingWorkspaces = useSelector(getOnboardingWorkspaces);
  const isCreateNewAppFlow = useSelector(
    getCurrentApplicationIdForCreateNewApp,
  );
  const isHomePage = useRouteMatch("/applications")?.isExact;
  const isAirgappedInstance = isAirgapped();
  const { appVersion } = getAppsmithConfigs();
  const howMuchTimeBefore = howMuchTimeBeforeText(appVersion.releaseDate);

  if (!isHomePage || !!isCreateNewAppFlow) return null;
  return (
    <div className="flex items-center">
      {<ShowUpgradeMenuItem />}
      {getShowAdminSettings(isFeatureEnabled, user) && (
        <Button
          className="admin-settings-menu-option"
          isIconButton
          kind="tertiary"
          onClick={() => {
            getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
              path: getAdminSettingsPath(
                isFeatureEnabled,
                user?.isSuperUser,
                tenantPermissions,
              ),
            });
          }}
          size="md"
          startIcon="settings-control"
        />
      )}
      {!isAirgappedInstance && (
        <Menu>
          <MenuTrigger>
            <Button
              isIconButton
              kind="tertiary"
              onClick={() => {}}
              size="md"
              startIcon="question-line"
            />
          </MenuTrigger>
          <MenuContent align="end" width="172px">
            <MenuItem
              className="t--welcome-tour"
              onClick={() => {
                if (!isFetchingApplications && !!onboardingWorkspaces.length) {
                  AnalyticsUtil.logEvent("WELCOME_TOUR_CLICK");
                  dispatch(onboardingCreateApplication());
                }
              }}
              startIcon="group-control"
            >
              {createMessage(TRY_GUIDED_TOUR)}
            </MenuItem>
            <MenuItem
              className="t--welcome-tour"
              onClick={() => {
                window.open(DOCS_BASE_URL, "_blank");
              }}
              startIcon="settings-control"
            >
              {createMessage(DOCUMENTATION)}
            </MenuItem>
            <MenuItem
              onClick={() => {
                window.open(DISCORD_URL, "_blank");
              }}
              startIcon="group-line"
            >
              {createMessage(JOIN_OUR_DISCORD)}
            </MenuItem>
            <MenuSeparator className="mb-1" />
            <MenuItem
              className="t--product-updates-btn"
              data-testid="t--product-updates-btn"
              onClick={() => {
                setIsProductUpdatesModalOpen(true);
              }}
              startIcon="logout"
            >
              {createMessage(WHATS_NEW)}
            </MenuItem>
            <VersionData>
              <span>
                {createMessage(
                  APPSMITH_DISPLAY_VERSION,
                  appVersion.edition,
                  appVersion.id,
                )}
              </span>
              {howMuchTimeBefore !== "" && (
                <span>Released {howMuchTimeBefore} ago</span>
              )}
            </VersionData>
          </MenuContent>
        </Menu>
      )}
    </div>
  );
};

export function PageHeader(props: PageHeaderProps) {
  const { user } = props;
  const location = useLocation();
  const dispatch = useDispatch();
  const isCreateNewAppFlow = useSelector(
    getCurrentApplicationIdForCreateNewApp,
  );
  const queryParams = new URLSearchParams(location.search);
  const isMobile = useIsMobileDevice();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showMobileSearchBar, setShowMobileSearchBar] = useState(false);
  const [isProductUpdatesModalOpen, setIsProductUpdatesModalOpen] =
    useState(false);
  const tenantConfig = useSelector(getTenantConfig);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
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

  useEffect(() => {
    dispatch(getTemplateNotificationSeenAction());
  }, []);

  const showBanner = useSelector(shouldShowLicenseBanner);
  const isHomePage = useRouteMatch("/applications")?.isExact;
  const isLicensePage = useRouteMatch("/license")?.isExact;

  const handleSearchDebounced = debounce((text: string) => {
    dispatch(searchEntities(text));
  }, 1000);

  function MobileSearchBar() {
    return (
      <StyledPageHeader
        data-testid="t--appsmith-page-header"
        hideShadow={props.hideShadow || false}
        isBannerVisible={showBanner && (isHomePage || isLicensePage)}
        isMobile={isMobile}
        showSeparator={props.showSeparator || false}
      >
        <div className="flex items-center pl-4 w-full">
          <Icon className="!text-black !mr-2" name="search" size={"md"} />
          <MobileSearchInput
            data-testid="t--application-search-input"
            defaultValue=""
            isDisabled={isFetchingApplications}
            onChange={noop}
            placeholder={""}
          />
          <Button
            className="!mr-2"
            isIconButton
            kind="tertiary"
            onClick={() => setShowMobileSearchBar(false)}
            size="md"
            startIcon="close-x"
          />
        </div>
      </StyledPageHeader>
    );
  }

  function MainSearchBar() {
    const [searchInput, setSearchInput] = useState("");
    const workspacesList = useSelector(getSearchedWorkspaces);
    const applicationsList = useSelector(getSearchedApplications);
    const canShowSearchDropdown = !!(
      workspacesList?.length || applicationsList?.length
    );

    function handleSearchInput(text: string) {
      setSearchInput(text);
      handleSearchDebounced(text);
    }
    return (
      <StyledPageHeader
        data-testid="t--appsmith-page-header"
        hideShadow={props.hideShadow || false}
        isBannerVisible={showBanner && (isHomePage || isLicensePage)}
        isMobile={isMobile}
        showSeparator={props.showSeparator || false}
      >
        <div className="flex items-center">
          {isMobile &&
            (!isMobileSidebarOpen ? (
              <Button
                className="!mr-2"
                isIconButton
                kind="tertiary"
                onClick={() => setIsMobileSidebarOpen(true)}
                size={"md"}
                startIcon="hamburger"
              />
            ) : (
              <Button
                className="!mr-2"
                isIconButton
                kind="tertiary"
                onClick={() => setIsMobileSidebarOpen(false)}
                size="md"
                startIcon="close-x"
              />
            ))}

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
        </div>
        {!isCreateNewAppFlow &&
          (isMobile ? (
            <Button
              isIconButton
              kind="tertiary"
              onClick={() => setShowMobileSearchBar(true)}
              size="md"
              startIcon="search"
            />
          ) : (
            <SearchContainer isMobile={isMobile}>
              <SearchInput
                data-testid="t--application-search-input"
                isDisabled={isFetchingApplications}
                onChange={handleSearchInput}
                placeholder={""}
                value={searchInput}
              />
              {canShowSearchDropdown && (
                <SearchListContainer>
                  {!!workspacesList?.length && (
                    <>
                      <Text className="!mb-2" kind="body-s">
                        Workspaces
                      </Text>
                      {workspacesList.map((workspace: Workspace) => (
                        <SearchListItem key={workspace.id}>
                          <Icon
                            className="!mr-2"
                            color="var(--ads-v2-color-fg)"
                            name="group-2-line"
                            size="md"
                          />
                          <Text className="truncate" kind="body-m">
                            {workspace.name}
                          </Text>
                        </SearchListItem>
                      ))}
                    </>
                  )}
                  {!!applicationsList?.length && (
                    <>
                      <Text className="!mb-2" kind="body-s">
                        Applications
                      </Text>
                      {applicationsList.map(
                        (application: ApplicationPayload) => (
                          <SearchListItem key={application.id}>
                            <Icon
                              className="!mr-2"
                              color="var(--ads-v2-color-fg)"
                              name="group-2-line"
                              size="md"
                            />
                            <Text className="truncate" kind="body-m">
                              {application.name}
                            </Text>
                          </SearchListItem>
                        ),
                      )}
                    </>
                  )}
                </SearchListContainer>
              )}
            </SearchContainer>
          ))}

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
              <div className="flex gap-2">
                <HomepageHeaderAction
                  setIsProductUpdatesModalOpen={setIsProductUpdatesModalOpen}
                  user={user}
                />
                <ProductUpdatesModal
                  isOpen={isProductUpdatesModalOpen}
                  onClose={() => setIsProductUpdatesModalOpen(false)}
                />
                <ProfileDropdown
                  hideEditProfileLink={props.hideEditProfileLink}
                  name={user.name}
                  navColorStyle={navColorStyle}
                  photoId={user?.photoId}
                  primaryColor={primaryColor}
                  userName={user.username}
                />
              </div>
            )}
          </div>
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

  return (
    <>
      <Banner />
      {showMobileSearchBar && isMobile ? (
        <MobileSearchBar />
      ) : (
        <MainSearchBar />
      )}
    </>
  );
}

const mapStateToProps = (state: AppState) => ({
  user: getCurrentUser(state),
  hideShadow: state.ui.theme.hideHeaderShadow,
  showSeparator: state.ui.theme.showHeaderSeparator,
});

export default connect(mapStateToProps)(PageHeader);
