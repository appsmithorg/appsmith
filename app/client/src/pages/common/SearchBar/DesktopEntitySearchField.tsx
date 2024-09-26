import { Icon, SearchInput, Spinner, Text } from "@appsmith/ads";
import React from "react";
import styled from "styled-components";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import WorkspaceSearchItems from "pages/common/SearchBar/WorkspaceSearchItems";
import ApplicationSearchItem from "pages/common/SearchBar/ApplicationSearchItem";
import PackageSearchItem from "ee/pages/common/PackageSearchItem";
import WorkflowSearchItem from "ee/pages/common/WorkflowSearchItem";
import { useRouteMatch } from "react-router";

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

  .search-loader {
    overflow: hidden;
  }
`;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DesktopEntitySearchField = (props: any) => {
  const isMobile = useIsMobileDevice();

  const {
    applicationsList,
    handleSearchInput,
    isDropdownOpen,
    isFetchingEntities,
    navigateToApplication,
    noSearchResults,
    searchedPackages,
    searchInput,
    searchInputRef,
    searchListContainerRef,
    setIsDropdownOpen,
    workflowsList,
    workspacesList,
  } = props;

  const isHomePage = useRouteMatch("/applications")?.isExact;

  if (!isHomePage) return null;

  return (
    <SearchContainer isMobile={isMobile}>
      <SearchInput
        data-testid="t--application-search-input"
        onChange={handleSearchInput}
        placeholder={""}
        ref={searchInputRef}
        value={searchInput}
      />
      {isDropdownOpen && (
        <SearchListContainer ref={searchListContainerRef}>
          {isFetchingEntities ? (
            <div className="search-loader">
              <Spinner />
            </div>
          ) : noSearchResults ? (
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
              <WorkflowSearchItem workflowsList={workflowsList} />
            </>
          )}
        </SearchListContainer>
      )}
    </SearchContainer>
  );
};

export default DesktopEntitySearchField;
