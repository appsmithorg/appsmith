import type { RefObject } from "react";
import React, { useState, useEffect, useRef } from "react";
import { useRouteMatch } from "react-router-dom";
import { connect, useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";
import StyledHeader from "components/designSystems/appsmith/StyledHeader";
import type { AppState } from "@appsmith/reducers";
import type { User } from "constants/userConstants";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { getTemplateNotificationSeenAction } from "actions/templateActions";
import { shouldShowLicenseBanner } from "@appsmith/selectors/tenantSelectors";
import { Banner } from "@appsmith/utils/licenseHelpers";
import {
  getIsFetchingEntities,
  getSearchedApplications,
  getSearchedWorkspaces,
} from "@appsmith/selectors/applicationSelectors";
import { getIsFetchingApplications } from "@appsmith/selectors/selectedWorkspaceSelectors";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import { debounce } from "lodash";
import bootIntercom from "utils/bootIntercom";
import { viewerURL } from "@appsmith/RouteBuilder";
import { getPackagesList } from "@appsmith/selectors/packageSelectors";
import Fuse from "fuse.js";
import {
  resetSearchEntity,
  searchEntities,
} from "@appsmith/actions/applicationActions";
import MainSearchBar from "./SearchBar/MainSearchBar";
import MobileSearchBar from "./SearchBar/MobileSearchBar";

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

interface PageHeaderProps {
  user?: User;
  hideShadow?: boolean;
  showSeparator?: boolean;
  hideEditProfileLink?: boolean;
}

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

export function PageHeader(props: PageHeaderProps) {
  const { user } = props;
  const dispatch = useDispatch();

  const isMobile = useIsMobileDevice();
  const [showMobileSearchBar, setShowMobileSearchBar] = useState(false);
  const isFetchingApplications = useSelector(getIsFetchingApplications);

  useEffect(() => {
    dispatch(getTemplateNotificationSeenAction());
  }, []);

  useEffect(() => {
    bootIntercom(user);
  }, [user?.email]);

  const showBanner = useSelector(shouldShowLicenseBanner);
  const isHomePage = useRouteMatch("/applications")?.isExact;
  const isLicensePage = useRouteMatch("/license")?.isExact;

  const handleSearchDebounced = debounce((text: string) => {
    if (text.trim().length !== 0) {
      dispatch(searchEntities(text));
    }
  }, 500);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [noSearchResults, setNoSearchResults] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchedPackages, setSearchedPackages] = useState([]);
  const searchListContainerRef = useRef(null);
  const isFetchingEntities = useSelector(getIsFetchingEntities);
  const workspacesList = useSelector(getSearchedWorkspaces);
  const applicationsList = useSelector(getSearchedApplications);
  const fetchedPackages = useSelector(getPackagesList);
  const prevIsFetchingEntitiesRef = useRef<boolean | undefined>(undefined);
  const searchInputRef = useRef(null);
  const fuzzy = new Fuse(fetchedPackages, {
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
      searchedPackages?.length
    );

  useOutsideClick(searchListContainerRef, searchInputRef, () => {
    setIsDropdownOpen(false);
  });

  function navigateToApplication(applicationId: string) {
    const searchedApplication = applicationsList?.find(
      (app: ApplicationPayload) => app.id === applicationId,
    );

    const defaultPageId = searchedApplication?.pages.find(
      (page) => page.isDefault === true,
    )?.id;
    const viewURL = viewerURL({
      pageId: defaultPageId,
    });
    setIsDropdownOpen(false);
    window.location.href = `${viewURL}`;
  }

  function handleSearchInput(text: string) {
    setSearchInput(text);
    handleSearchDebounced(text);
    setSearchedPackages(fuzzy.search(text));
    setIsDropdownOpen(true);
  }

  function handleInputClicked() {
    if (searchInput?.trim()?.length || !noSearchResults) {
      setIsDropdownOpen(false);
    }
  }

  useEffect(() => {
    const prevIsFetchingEntities = prevIsFetchingEntitiesRef.current;
    if (prevIsFetchingEntities && !isFetchingEntities) {
      if (
        !workspacesList?.length &&
        !applicationsList?.length &&
        !searchedPackages?.length
      ) {
        setNoSearchResults(true);
      } else {
        setNoSearchResults(false);
      }
    }
    prevIsFetchingEntitiesRef.current = isFetchingEntities;
  }, [isFetchingEntities]);

  useEffect(() => {
    if (!isDropdownOpen) {
      dispatch(resetSearchEntity());
    }
  }, [isDropdownOpen]);

  return (
    <>
      <Banner />
      {showMobileSearchBar && isMobile ? (
        <StyledPageHeader
          data-testid="t--appsmith-page-header"
          hideShadow={props.hideShadow || false}
          isBannerVisible={showBanner && (isHomePage || isLicensePage)}
          isMobile={isMobile}
          showSeparator={props.showSeparator || false}
        >
          <MobileSearchBar
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
            setIsDropdownOpen={setIsDropdownOpen}
            setShowMobileSearchBar={setShowMobileSearchBar}
            workspacesList={workspacesList}
          />
        </StyledPageHeader>
      ) : (
        <StyledPageHeader
          data-testid="t--appsmith-page-header"
          hideShadow={props.hideShadow || false}
          isBannerVisible={showBanner && (isHomePage || isLicensePage)}
          isMobile={isMobile}
          showSeparator={props.showSeparator || false}
        >
          <MainSearchBar
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
            setIsDropdownOpen={setIsDropdownOpen}
            setShowMobileSearchBar={setShowMobileSearchBar}
            user={user}
            workspacesList={workspacesList}
          />
        </StyledPageHeader>
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
