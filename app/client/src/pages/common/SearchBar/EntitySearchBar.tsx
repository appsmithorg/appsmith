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
import {
  getCurrentApplicationIdForCreateNewApp,
  getSearchedApplications,
} from "@appsmith/selectors/applicationSelectors";
import { NAVIGATION_SETTINGS } from "constants/AppConstants";
import { getCurrentApplication } from "selectors/editorSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { debounce, get } from "lodash";
import HomepageHeaderAction from "pages/common/SearchBar/HomepageHeaderAction";
import ProfileDropdown from "pages/common/ProfileDropdown";
import MobileSideBar from "pages/common/MobileSidebar";
import DesktopEntitySearchField from "@appsmith/pages/Homepage/DesktopEntitySearchField";
import MobileEntitySearchField from "@appsmith/pages/Homepage/MobileEntitySearchField";
import {
  resetSearchEntity,
  searchEntities,
  setFetchingApplications,
} from "@appsmith/actions/applicationActions";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import { viewerURL } from "@appsmith/RouteBuilder";

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

  const tenantConfig = useSelector(getTenantConfig);
  const applicationsList = useSelector(getSearchedApplications);
  const isCreateNewAppFlow = useSelector(
    getCurrentApplicationIdForCreateNewApp,
  );
  const currentApplicationDetails = useSelector(getCurrentApplication);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const location = useLocation();

  const searchListContainerRef = useRef(null);
  const prevIsFetchingEntitiesRef = useRef<boolean | undefined>(undefined);
  const searchInputRef = useRef(null);

  function handleInputClicked() {
    if (searchInput?.trim()?.length || !noSearchResults) {
      setIsDropdownOpen(false);
      dispatch(setFetchingApplications(false));
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
      (page) => page.isDefault === true,
    )?.id;
    const viewURL = viewerURL({
      pageId: defaultPageId,
    });
    setIsDropdownOpen(false);
    window.location.href = `${viewURL}`;
  }

  useEffect(() => {
    if (!isDropdownOpen) {
      dispatch(resetSearchEntity());
    }
  }, [isDropdownOpen]);

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
      handleInputClicked={handleInputClicked}
      handleSearchDebounced={handleSearchDebounced}
      isDropdownOpen={isDropdownOpen}
      navigateToApplication={navigateToApplication}
      noSearchResults={noSearchResults}
      prevIsFetchingEntitiesRef={prevIsFetchingEntitiesRef}
      searchListContainerRef={searchListContainerRef}
      setIsDropdownOpen={setIsDropdownOpen}
      setNoSearchResults={setNoSearchResults}
      setSearchInput={setSearchInput}
      setShowMobileSearchBar={setShowMobileSearchBar}
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
            handleInputClicked={handleInputClicked}
            handleSearchDebounced={handleSearchDebounced}
            isDropdownOpen={isDropdownOpen}
            navigateToApplication={navigateToApplication}
            noSearchResults={noSearchResults}
            prevIsFetchingEntitiesRef={prevIsFetchingEntitiesRef}
            searchInput={searchInput}
            searchInputRef={searchInputRef}
            searchListContainerRef={searchListContainerRef}
            setIsDropdownOpen={setIsDropdownOpen}
            setNoSearchResults={setNoSearchResults}
            setSearchInput={setSearchInput}
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
