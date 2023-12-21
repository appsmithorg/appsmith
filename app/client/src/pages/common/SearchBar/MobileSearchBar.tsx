import { DEFAULT_PACKAGE_ICON } from "@appsmith/constants/PackageConstants";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import type { Workspace } from "@appsmith/constants/workspaceConstants";
import { Button, Icon, SearchInput, Spinner, Text } from "design-system";
import React from "react";
import styled from "styled-components";
import { getApplicationIcon } from "utils/AppsmithUtils";
import { Size, type AppIconName, AppIcon } from "design-system-old";

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

const MobileSearchInput = styled(SearchInput)`
  span {
    display: none;
  }
  input {
    border: none !important;
    padding: 0 0 0 4px !important;
  }
`;

function MobileSearchBar(props: any) {
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
    searchListContainerRef,
    setIsDropdownOpen,
    setShowMobileSearchBar,
    workspacesList,
  } = props;
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
                  {applicationsList.map((application: ApplicationPayload) => (
                    <SearchListItem
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
    </>
  );
}
export default MobileSearchBar;
