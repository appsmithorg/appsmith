import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { APPLICATIONS_URL, AUTH_LOGIN_URL } from "constants/routes";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { Button } from "design-system";
import type { RefObject } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import EditorButton from "components/editorComponents/Button";
import history from "utils/history";
import ProductUpdatesModal from "pages/Applications/ProductUpdatesModal";
import { useDispatch, useSelector } from "react-redux";
import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import { getCurrentApplicationIdForCreateNewApp } from "@appsmith/selectors/applicationSelectors";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { getCurrentApplication } from "selectors/editorSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { debounce, get } from "lodash";
import HomepageHeaderAction from "pages/common/SearchBar/HomepageHeaderAction";
import ProfileDropdown from "pages/common/ProfileDropdown";
import MobileSideBar from "pages/common/MobileSidebar";
import {
  resetSearchEntity,
  searchEntities,
  searchWorkspaceEntitiesLoader,
} from "@appsmith/actions/workspaceActions";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import { viewerURL } from "@appsmith/RouteBuilder";
import {
  getIsFetchingEntities,
  getSearchedApplications,
  getSearchedWorkspaces,
} from "@appsmith/selectors/workspaceSelectors";
import DesktopEntitySearchField from "pages/common/SearchBar/DesktopEntitySearchField";
import MobileEntitySearchField from "pages/common/SearchBar/MobileEntitySearchField";
import { getIsFetchingApplications } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { getPackagesList } from "@appsmith/selectors/packageSelectors";
import Fuse from "fuse.js";
import { getWorkflowsList } from "@appsmith/selectors/workflowSelectors";

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

function useOutsideClick<T extends HTMLElement>(
  ref: RefObject<T>,
  inputRef: RefObject<T>,
  callback: () => void,
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, inputRef, callback]);
}

function EntitySearchBar(props: any) {
  const isMobile = useIsMobileDevice();
  const dispatch = useDispatch();

  const { user } = props;

  const [showMobileSearchBar, setShowMobileSearchBar] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [noSearchResults, setNoSearchResults] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isProductUpdatesModalOpen, setIsProductUpdatesModalOpen] =
    useState(false);
  const [searchedPackages, setSearchedPackages] = useState([]);
  const [searchedWorkflows, setSearchedWorkflows] = useState([]);

  const tenantConfig = useSelector(getTenantConfig);
  const applicationsList = useSelector(getSearchedApplications);
  const isCreateNewAppFlow = useSelector(
    getCurrentApplicationIdForCreateNewApp,
  );
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isFetchingEntities = useSelector(getIsFetchingEntities);
  const fetchedPackages = useSelector(getPackagesList);
  const fetchedWorkflows = useSelector(getWorkflowsList);
  const workspacesList = useSelector(getSearchedWorkspaces);

  const location = useLocation();

  const searchListContainerRef = useRef(null);
  const prevIsFetchingEntitiesRef = useRef<boolean | undefined>(undefined);
  const searchInputRef = useRef(null);

  const packageFuzzy = new Fuse(fetchedPackages, {
    keys: ["name"],
    shouldSort: true,
    threshold: 0.5,
    location: 0,
    distance: 100,
  });

  const workflowFuzzy = new Fuse(fetchedWorkflows, {
    keys: ["name"],
    shouldSort: true,
    threshold: 0.5,
    location: 0,
    distance: 100,
  });

  const canShowSearchDropdown =
    (noSearchResults && !isFetchingEntities) ||
    isFetchingEntities ||
    !!(
      workspacesList?.length ||
      applicationsList?.length ||
      searchedPackages?.length ||
      searchedWorkflows?.length
    );

  function handleInputClicked() {
    if (searchInput?.trim()?.length || !noSearchResults) {
      dispatch(searchEntities(searchInput));
      setIsDropdownOpen(true);
    }
  }

  const handleSearchDebounced = useCallback(
    debounce((text: string) => {
      if (text.trim().length !== 0) {
        dispatch(searchEntities(text));
      }
    }, 1000),
    [],
  );

  function navigateToApplication(applicationId: string) {
    const searchedApplication = applicationsList?.find(
      (app: ApplicationPayload) => app.id === applicationId,
    );

    const defaultPageId = searchedApplication?.pages.find(
      (page: any) => page.isDefault === true,
    )?.id;
    const viewURL = viewerURL({
      pageId: defaultPageId,
    });
    setIsDropdownOpen(false);
    window.location.href = `${viewURL}`;
  }

  function handleSearchInput(text: string) {
    setSearchInput(text);
    if (text.trim().length !== 0) dispatch(searchWorkspaceEntitiesLoader(true));
    else dispatch(searchWorkspaceEntitiesLoader(false));
    handleSearchDebounced(text);
    setSearchedPackages(packageFuzzy.search(text));
    setSearchedWorkflows(workflowFuzzy.search(text));
    setIsDropdownOpen(true);
  }

  useEffect(() => {
    if (!isDropdownOpen) {
      dispatch(resetSearchEntity());
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    const prevIsFetchingEntities = prevIsFetchingEntitiesRef.current;
    if (prevIsFetchingEntities && !isFetchingEntities) {
      if (
        !workspacesList?.length &&
        !applicationsList?.length &&
        !searchedPackages?.length &&
        !searchedWorkflows?.length
      ) {
        setNoSearchResults(true);
      } else {
        setNoSearchResults(false);
      }
    }
    prevIsFetchingEntitiesRef.current = isFetchingEntities;
  }, [isFetchingEntities]);

  useOutsideClick(searchListContainerRef, searchInputRef, () => {
    setIsDropdownOpen(false);
  });

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
      canShowSearchDropdown={canShowSearchDropdown}
      handleInputClicked={handleInputClicked}
      handleSearchInput={handleSearchInput}
      isDropdownOpen={isDropdownOpen}
      isFetchingApplications={isFetchingApplications}
      isFetchingEntities={isFetchingEntities}
      navigateToApplication={navigateToApplication}
      noSearchResults={noSearchResults}
      searchListContainerRef={searchListContainerRef}
      searchedPackages={searchedPackages}
      searchedWorkflows={searchedWorkflows}
      setIsDropdownOpen={setIsDropdownOpen}
      setShowMobileSearchBar={setShowMobileSearchBar}
      workspacesList={workspacesList}
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
            canShowSearchDropdown={canShowSearchDropdown}
            handleInputClicked={handleInputClicked}
            handleSearchInput={handleSearchInput}
            isDropdownOpen={isDropdownOpen}
            isFetchingApplications={isFetchingApplications}
            isFetchingEntities={isFetchingEntities}
            navigateToApplication={navigateToApplication}
            noSearchResults={noSearchResults}
            searchInput={searchInput}
            searchInputRef={searchInputRef}
            searchListContainerRef={searchListContainerRef}
            searchedPackages={searchedPackages}
            searchedWorkflows={searchedWorkflows}
            setIsDropdownOpen={setIsDropdownOpen}
            workspacesList={workspacesList}
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
