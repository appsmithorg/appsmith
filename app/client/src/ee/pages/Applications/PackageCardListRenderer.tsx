export * from "ce/pages/Applications/PackageCardList";

import React from "react";
import { Button, Text } from "design-system";

import PackageCard from "@appsmith/pages/Applications/PackageCard";
import {
  ResourceHeading,
  CardListWrapper,
  PaddingWrapper,
  CardListContainer,
  Space,
} from "pages/Applications/CommonElements";
import { NoAppsFound } from "@appsmith/pages/Applications";
import {
  EMPTY_PACKAGE_LIST,
  createMessage,
} from "@appsmith/constants/messages";
import type { Package } from "@appsmith/constants/PackageConstants";
import { NEW_PACKAGE } from "@appsmith/constants/messages";

export interface PackageCardListRendererProps {
  createPackage: () => void;
  isCreatingPackage?: boolean;
  isFetchingPackages?: boolean;
  isMobile: boolean;
  packages?: Package[];
  workspaceId: string;
}

function PackageCardListRenderer({
  createPackage,
  isCreatingPackage = false,
  isFetchingPackages = false,
  isMobile,
  packages = [],
  workspaceId,
}: PackageCardListRendererProps) {
  return (
    <CardListContainer isMobile={isMobile}>
      <ResourceHeading isLoading={isFetchingPackages}>Packages</ResourceHeading>
      <Space />
      <CardListWrapper isMobile={isMobile} key={workspaceId}>
        {packages.map((pkg: any) => {
          return (
            <PaddingWrapper isMobile={isMobile} key={pkg.id}>
              <PackageCard
                isFetchingPackages={isFetchingPackages}
                isMobile={isMobile}
                key={pkg.id}
                pkg={pkg}
                workspaceId={workspaceId}
              />
            </PaddingWrapper>
          );
        })}
        {packages.length === 0 && (
          <NoAppsFound>
            <img
              className="mb-7"
              src="https://assets.appsmith.com/no-packages.svg"
            />
            <Text kind="heading-xs">{createMessage(EMPTY_PACKAGE_LIST)}</Text>
            <Button
              className="t--new-package-button createnew"
              isLoading={isCreatingPackage}
              kind="secondary"
              onClick={createPackage}
              size="md"
              startIcon="plus"
            >
              {createMessage(NEW_PACKAGE)}
            </Button>
          </NoAppsFound>
        )}
      </CardListWrapper>
    </CardListContainer>
  );
}

export default PackageCardListRenderer;
