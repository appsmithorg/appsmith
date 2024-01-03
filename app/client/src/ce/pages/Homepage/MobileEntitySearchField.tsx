import { Button, Icon, SearchInput, Spinner, Text } from "design-system";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { getIsFetchingApplications } from "@appsmith/selectors/selectedWorkspaceSelectors";
import {
  getIsFetchingEntities,
  getSearchedApplications,
  getSearchedWorkspaces,
} from "@appsmith/selectors/applicationSelectors";
import { setFetchingApplications } from "@appsmith/actions/applicationActions";
import { getPackagesList } from "@appsmith/selectors/packageSelectors";
import Fuse from "fuse.js";
import WorkspaceSearchItems from "pages/common/SearchBar/WorkspaceSearchItems";
import ApplicationSearchItem from "pages/common/SearchBar/ApplicationSearchItem";

const SearchListContainer = styled.div`
  width: 100%;
  height: 100vh;
  position: absolute;
  top: 47px;
  left: 0;
  border: solid 1px var(--ads-v2-color-bg-muted);
  background-color: var(--ads-v2-color-bg);
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow-y: auto;
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

function MobileEntitySearchField(props: any) {
  const {
    handleInputClicked,
    handleSearchDebounced,
    isDropdownOpen,
    navigateToApplication,
    noSearchResults,
    prevIsFetchingEntitiesRef,
    searchListContainerRef,
    setIsDropdownOpen,
    setNoSearchResults,
    setSearchInput,
    setShowMobileSearchBar,
  } = props;

  const dispatch = useDispatch();
  const [searchedPackages, setSearchedPackages] = useState([]);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isFetchingEntities = useSelector(getIsFetchingEntities);
  const workspacesList = useSelector(getSearchedWorkspaces);
  const applicationsList = useSelector(getSearchedApplications);
  const fetchedPackages = useSelector(getPackagesList);

  const canShowSearchDropdown =
    (noSearchResults && !isFetchingEntities) ||
    isFetchingEntities ||
    !!(
      workspacesList?.length ||
      applicationsList?.length ||
      searchedPackages?.length
    );

  function handleSearchInput(text: string) {
    setSearchInput(text);
    if (text.trim().length !== 0) dispatch(setFetchingApplications(true));
    else dispatch(setFetchingApplications(false));
    handleSearchDebounced(text);
    setSearchedPackages(fuzzy.search(text));
    setIsDropdownOpen(true);
  }

  const fuzzy = new Fuse(fetchedPackages, {
    keys: ["name"],
    shouldSort: true,
    threshold: 0.5,
    location: 0,
    distance: 100,
  });

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

  return (
    <>
      <div className="flex items-center w-full pl-4">
        <Icon className="!text-black !mr-2" name="search" size={"md"} />
        <MobileSearchInput
          data-testid="t--application-search-input"
          defaultValue=""
          isDisabled={isFetchingApplications}
          onChange={handleSearchInput}
          onClick={handleInputClicked}
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
    </>
  );
}
export default MobileEntitySearchField;
