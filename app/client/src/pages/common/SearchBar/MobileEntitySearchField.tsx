import { Button, Icon, SearchInput, Spinner, Text } from "design-system";
import React from "react";
import styled from "styled-components";
import WorkspaceSearchItems from "pages/common/SearchBar/WorkspaceSearchItems";
import ApplicationSearchItem from "pages/common/SearchBar/ApplicationSearchItem";
import PackageSearchItem from "@appsmith/pages/common/PackageSearchItem";
import WorkflowSearchItem from "@appsmith/pages/common/WorkflowSearchItem";
import { useRouteMatch } from "react-router";

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
    searchedWorkflows,
    searchListContainerRef,
    setIsDropdownOpen,
    setShowMobileSearchBar,
    workspacesList,
  } = props;

  const isHomePage = useRouteMatch("/applications")?.isExact;

  if (!isHomePage) return null;
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
            <div className="no-search-results text-center py-[52px]">
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
              <PackageSearchItem searchedPackages={searchedPackages} />
              <WorkflowSearchItem searchedWorkflows={searchedWorkflows} />
            </>
          )}
        </SearchListContainer>
      )}
    </>
  );
}
export default MobileEntitySearchField;
