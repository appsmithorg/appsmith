export * from "ce/pages/Applications/PackageCardList";

import React from "react";
import { Text } from "design-system";

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
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

export interface PackageCardListRendererProps {
  createPackage: () => void;
  isCreatingPackage?: boolean;
  isFetchingPackages?: boolean;
  isMobile: boolean;
  packages?: Package[];
  workspaceId: string;
}

function PackageCardListRenderer({
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
              src={getAssetUrl(`${ASSETS_CDN_URL}/no-packages.svg`)}
            />
            <Text kind="heading-xs">{createMessage(EMPTY_PACKAGE_LIST)}</Text>
          </NoAppsFound>
        )}
      </CardListWrapper>
    </CardListContainer>
  );
}

export default PackageCardListRenderer;
