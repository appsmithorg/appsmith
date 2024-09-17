import { getAssetUrl } from "ee/utils/airgapHelpers";
import { APPLICATIONS_URL, AUTH_LOGIN_URL } from "constants/routes";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { Button } from "@appsmith/ads";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import EditorButton from "components/editorComponents/Button";
import history from "utils/history";
import ProductUpdatesModal from "pages/Applications/ProductUpdatesModal";
import { useDispatch, useSelector } from "react-redux";
import { getTenantConfig } from "ee/selectors/tenantSelectors";
import {
  getCurrentApplication,
  getCurrentApplicationIdForCreateNewApp,
} from "ee/selectors/applicationSelectors";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { debounce, get } from "lodash";
import HomepageHeaderAction from "pages/common/SearchBar/HomepageHeaderAction";
import ProfileDropdown from "pages/common/ProfileDropdown";
import MobileSideBar from "pages/common/MobileSidebar";
import { resetSearchEntity, searchEntities } from "ee/actions/workspaceActions";
import type { ApplicationPayload } from "entities/Application";
import { viewerURL } from "ee/RouteBuilder";
import {
  getIsFetchingEntities,
  getSearchedApplications,
  getSearchedWorkflows,
  getSearchedWorkspaces,
} from "ee/selectors/workspaceSelectors";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import DesktopEntitySearchField from "pages/common/SearchBar/DesktopEntitySearchField";
import MobileEntitySearchField from "pages/common/SearchBar/MobileEntitySearchField";
import { getPackagesList } from "ee/selectors/packageSelectors";
import Fuse from "fuse.js";
import { useOutsideClick } from "ee/hooks";
import type { PageDefaultMeta } from "ee/api/ApplicationApi";

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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EntitySearchBar(props: any) {
  const isMobile = useIsMobileDevice();
  const dispatch = useDispatch();

  const { user } = props;

  const [showMobileSearchBar, setShowMobileSearchBar] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [noSearchResults, setNoSearchResults] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isProductUpdatesModalOpen, setIsProductUpdatesModalOpen] =
    useState(false);
  const [searchedPackages, setSearchedPackages] = useState([]);

  const tenantConfig = useSelector(getTenantConfig);
  const isCreateNewAppFlow = useSelector(
    getCurrentApplicationIdForCreateNewApp,
  );
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const workspacesList = useSelector(getSearchedWorkspaces);
  const applicationsList = useSelector(getSearchedApplications);
  const workflowsList = useSelector(getSearchedWorkflows);
  const fetchedPackages = useSelector(getPackagesList);
  const isFetchingEntities = useSelector(getIsFetchingEntities);
  const location = useLocation();
  const searchListContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const selectedWorkspaceId = useSelector(getCurrentWorkspaceId);

  useEffect(() => {
    if (searchInput.trim().length > 0) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  }, [searchInput]);

  useEffect(() => {
    if (
      isDropdownOpen &&
      !isFetchingEntities &&
      !workspacesList?.length &&
      !applicationsList?.length &&
      !workflowsList?.length &&
      !searchedPackages?.length
    ) {
      setNoSearchResults(true);
    } else {
      setNoSearchResults(false);
    }
  }, [
    isFetchingEntities,
    isDropdownOpen,
    workspacesList,
    applicationsList,
    workflowsList,
    searchedPackages,
  ]);

  useEffect(() => {
    if (!isDropdownOpen) {
      dispatch(resetSearchEntity());
    }
  }, [isDropdownOpen]);

  useOutsideClick(searchListContainerRef, searchInputRef, () => {
    setIsDropdownOpen(false);
  });

  const packageFuzzy = new Fuse(fetchedPackages, {
    keys: ["name"],
    shouldSort: true,
    threshold: 0.5,
    location: 0,
    distance: 100,
  });

  function navigateToApplication(applicationId: string) {
    const searchedApplication = applicationsList?.find(
      (app: ApplicationPayload) => app.id === applicationId,
    );

    const defaultPage = searchedApplication?.pages.find(
      (page: PageDefaultMeta) => page.isDefault === true,
    );
    const viewURL = viewerURL({
      basePageId: defaultPage.baseId,
    });
    window.location.href = `${viewURL}`;
  }

  const handleSearchDebounced = useCallback(
    debounce((text: string) => {
      if (text.trim().length !== 0) {
        dispatch(searchEntities(text));
        setSearchedPackages(packageFuzzy.search(text));
        setIsSearching(false);
      }
    }, 1000),
    [],
  );

  const handleSearchInput = (text: string) => {
    setIsSearching(true);
    setSearchInput(text);
    handleSearchDebounced(text);
  };

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

  return showMobileSearchBar && isMobile ? (
    <MobileEntitySearchField
      applicationsList={applicationsList}
      handleSearchInput={handleSearchInput}
      isDropdownOpen={isDropdownOpen}
      isFetchingEntities={isSearching}
      navigateToApplication={navigateToApplication}
      noSearchResults={noSearchResults}
      searchListContainerRef={searchListContainerRef}
      searchedPackages={searchedPackages}
      setIsDropdownOpen={setIsDropdownOpen}
      setShowMobileSearchBar={setShowMobileSearchBar}
      workflowsList={workflowsList}
      workspacesList={workspacesList}
      selectedWorkspaceId={selectedWorkspaceId}
    />
  ) : (
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
          <DesktopEntitySearchField
            applicationsList={applicationsList}
            handleSearchInput={handleSearchInput}
            isDropdownOpen={isDropdownOpen}
            isFetchingEntities={isSearching}
            navigateToApplication={navigateToApplication}
            noSearchResults={noSearchResults}
            searchInput={searchInput}
            searchInputRef={searchInputRef}
            searchListContainerRef={searchListContainerRef}
            searchedPackages={searchedPackages}
            setIsDropdownOpen={setIsDropdownOpen}
            workflowsList={workflowsList}
            workspacesList={workspacesList}
            selectedWorkspaceId={selectedWorkspaceId}
          />
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

export default EntitySearchBar;
