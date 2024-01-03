import {
  DEFAULT_PACKAGE_ICON,
  type Package,
} from "@appsmith/constants/PackageConstants";
import { Icon, Text } from "design-system";
import React from "react";
import { SearchListItem } from "./WorkspaceSearchItems";
import history from "utils/history";
import { BASE_PACKAGE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";

interface Props {
  searchedPackages: Package[];
}

const PackageSearchItem = (props: Props) => {
  const { searchedPackages } = props;
  if (!searchedPackages || searchedPackages?.length === 0) return null;
  return (
    <div>
      <Text className="!mb-2 !block" kind="body-s">
        Packages
      </Text>
      {searchedPackages.map((pkg: any) => (
        <SearchListItem
          key={pkg.id}
          onClick={() => history.push(`${BASE_PACKAGE_EDITOR_PATH}/${pkg.id}`)}
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
  );
};

export default PackageSearchItem;
