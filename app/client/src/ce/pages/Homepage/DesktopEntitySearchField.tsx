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
import WorkspaceSearchItems from "pages/common/SearchBar/WorkspaceSearchItems";
import ApplicationSearchItem from "pages/common/SearchBar/ApplicationSearchItem";

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
              <WorkspaceSearchItems
                setIsDropdownOpen={setIsDropdownOpen}
                workspacesList={workspacesList}
              />
              <ApplicationSearchItem
                applicationsList={applicationsList}
                navigateToApplication={navigateToApplication}
              />
            </>
          )}
        </SearchListContainer>
      )}
    </SearchContainer>
  );
};

export default DesktopEntitySearchField;
