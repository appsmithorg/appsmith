import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { DEFAULT_PACKAGE_ICON } from "@appsmith/constants/PackageConstants";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import type { Workspace } from "@appsmith/constants/workspaceConstants";
import { APPLICATIONS_URL, AUTH_LOGIN_URL } from "constants/routes";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { Button, Icon, SearchInput, Spinner, Text } from "design-system";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { getApplicationIcon } from "utils/AppsmithUtils";
import { Size, type AppIconName, AppIcon } from "design-system-old";
import EditorButton from "components/editorComponents/Button";
import HomepageHeaderAction from "./HomepageHeaderAction";
import history from "utils/history";
import MobileSideBar from "../MobileSidebar";
import ProductUpdatesModal from "pages/Applications/ProductUpdatesModal";
import ProfileDropdown from "../ProfileDropdown";
import { useSelector } from "react-redux";
import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import { getCurrentApplicationIdForCreateNewApp } from "@appsmith/selectors/applicationSelectors";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { getCurrentApplication } from "selectors/editorSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { get } from "lodash";

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

const CircleAppIcon = styled(AppIcon)`
  display: flex;
  align-items: center;
  svg {
    width: 16px;
    height: 16px;
    path {
      fill: var(--ads-v2-color-fg);
    }
  }
`;

function MainSearchBar(props: any) {
  const isMobile = useIsMobileDevice();
  const {
    applicationsList,
    canShowSearchDropdown,
    handleInputClicked,
    handleSearchInput,
    isDropdownOpen,
    isFetchingApplications,
    isFetchingEntities,
    navigateToApplication,
    noSearchResults,
    searchedPackages,
    searchInput,
    searchInputRef,
    searchListContainerRef,
    setIsDropdownOpen,
    setShowMobileSearchBar,
    user,
    workspacesList,
  } = props;
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const tenantConfig = useSelector(getTenantConfig);
  const isCreateNewAppFlow = useSelector(
    getCurrentApplicationIdForCreateNewApp,
  );
  const [isProductUpdatesModalOpen, setIsProductUpdatesModalOpen] =
    useState(false);
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const navColorStyle =
    currentApplicationDetails?.applicationDetail?.navigationSetting
      ?.colorStyle || NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;

  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );

  let loginUrl = AUTH_LOGIN_URL;
  if (queryParams.has("redirectUrl")) {
    loginUrl += `?redirectUrl
    =${queryParams.get("redirectUrl")}`;
  }
  return (
    <>
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
              onClick={handleInputClicked}
              placeholder={""}
              ref={searchInputRef}
              value={searchInput}
            />
            {isDropdownOpen && canShowSearchDropdown && (
              <SearchListContainer ref={searchListContainerRef}>
                {noSearchResults && !isFetchingEntities && (
                  <div className="text-center py-[52px]">
                    <Icon
                      className="mb-2"
                      color="--ads-v2-color-fg"
                      name="search-line"
                      size="lg"
                    />
                    <Text className="!mb-1 !block" kind="heading-xs">
                      No search results found
                    </Text>
                    <Text className="!mb-1 !block" kind="body-m">
                      Please try again with a <br /> different search query
                    </Text>
                  </div>
                )}
                {isFetchingEntities ? (
                  <div className="search-loader">
                    <Spinner />
                  </div>
                ) : (
                  <>
                    {!!workspacesList?.length && (
                      <div className="mb-2">
                        <Text className="!mb-2 !block" kind="body-s">
                          Workspaces
                        </Text>
                        {workspacesList.map((workspace: Workspace) => (
                          <SearchListItem
                            key={workspace.id}
                            onClick={() => {
                              setIsDropdownOpen(false);
                              window.location.href = `${window.location.pathname}#${workspace?.id}`;
                            }}
                          >
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
                      </div>
                    )}
                    {!!applicationsList?.length && (
                      <div className="mb-2">
                        <Text className="!mb-2 !block" kind="body-s">
                          Applications
                        </Text>
                        {applicationsList.map(
                          (application: ApplicationPayload) => (
                            <SearchListItem
                              key={application.id}
                              onClick={() =>
                                navigateToApplication(application.id)
                              }
                            >
                              <CircleAppIcon
                                className="!mr-1"
                                color="var(--ads-v2-color-fg)"
                                name={
                                  application?.icon ||
                                  (getApplicationIcon(
                                    application.id,
                                  ) as AppIconName)
                                }
                                size={Size.xxs}
                              />
                              <Text className="truncate" kind="body-m">
                                {application.name}
                              </Text>
                            </SearchListItem>
                          ),
                        )}
                      </div>
                    )}
                    {!!searchedPackages?.length && (
                      <div>
                        <Text className="!mb-2 !block" kind="body-s">
                          Packages
                        </Text>
                        {searchedPackages.map((pkg: any) => (
                          <SearchListItem key={pkg.id}>
                            <Icon
                              className="!mr-2"
                              color="var(--ads-v2-color-fg)"
                              name={pkg.icon || DEFAULT_PACKAGE_ICON}
                              size="md"
                            />
                            <Text className="truncate" kind="body-m">
                              {pkg.name}
                            </Text>
                          </SearchListItem>
                        ))}
                      </div>
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
    </>
  );
}

export default MainSearchBar;
