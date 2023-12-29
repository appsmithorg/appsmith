import { getIsFetchingApplications } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { setFetchingApplications } from "@appsmith/actions/applicationActions";
import { Icon, SearchInput, Spinner, Text } from "design-system";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import {
  getIsFetchingEntities,
  getSearchedApplications,
  getSearchedWorkspaces,
} from "@appsmith/selectors/applicationSelectors";
import Fuse from "fuse.js";
import { getPackagesList } from "@appsmith/selectors/packageSelectors";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import type { Workspace } from "@appsmith/constants/workspaceConstants";
import { Size, type AppIconName, AppIcon } from "design-system-old";
import { getApplicationIcon } from "utils/AppsmithUtils";
import { BASE_PACKAGE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";
import { DEFAULT_PACKAGE_ICON } from "@appsmith/constants/PackageConstants";
import history from "utils/history";

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

const DesktopEntitySearchField = (props: any) => {
  const isMobile = useIsMobileDevice();
  const dispatch = useDispatch();

  const {
    handleInputClicked,
    handleSearchDebounced,
    isDropdownOpen,
    navigateToApplication,
    noSearchResults,
    prevIsFetchingEntitiesRef,
    searchInput,
    searchInputRef,
    searchListContainerRef,
    setIsDropdownOpen,
    setNoSearchResults,
    setSearchInput,
  } = props;

  const [searchedPackages, setSearchedPackages] = useState([]);

  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const applicationsList = useSelector(getSearchedApplications);
  const isFetchingEntities = useSelector(getIsFetchingEntities);
  const fetchedPackages = useSelector(getPackagesList);
  const workspacesList = useSelector(getSearchedWorkspaces);

  const fuzzy = new Fuse(fetchedPackages, {
    keys: ["name"],
    shouldSort: true,
    threshold: 0.5,
    location: 0,
    distance: 100,
  });

  function handleSearchInput(text: string) {
    setSearchInput(text);
    if (text.trim().length !== 0) dispatch(setFetchingApplications(true));
    else dispatch(setFetchingApplications(false));
    handleSearchDebounced(text);
    setSearchedPackages(fuzzy.search(text));
    setIsDropdownOpen(true);
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

  const canShowSearchDropdown =
    (noSearchResults && !isFetchingEntities) ||
    isFetchingEntities ||
    !!(
      workspacesList?.length ||
      applicationsList?.length ||
      searchedPackages?.length
    );

  return (
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
                      data-testId={workspace.name}
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
                  {applicationsList.map((application: ApplicationPayload) => (
                    <SearchListItem
                      data-testId={application.name}
                      key={application.id}
                      onClick={() => navigateToApplication(application.id)}
                    >
                      <CircleAppIcon
                        className="!mr-1"
                        color="var(--ads-v2-color-fg)"
                        name={
                          application?.icon ||
                          (getApplicationIcon(application.id) as AppIconName)
                        }
                        size={Size.xxs}
                      />
                      <Text className="truncate" kind="body-m">
                        {application.name}
                      </Text>
                    </SearchListItem>
                  ))}
                </div>
              )}
              {!!searchedPackages?.length && (
                <div>
                  <Text className="!mb-2 !block" kind="body-s">
                    Packages
                  </Text>
                  {searchedPackages.map((pkg: any) => (
                    <SearchListItem
                      key={pkg.id}
                      onClick={() =>
                        history.push(`${BASE_PACKAGE_EDITOR_PATH}/${pkg.id}`)
                      }
                    >
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
  );
};

export default DesktopEntitySearchField;
