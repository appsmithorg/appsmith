import React from "react";
import { Flex, Text } from "@appsmith/ads";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import {
  CREATE_NEW_DATASOURCE_AUTHENTICATED_REST_API,
  createMessage,
  EMPTY_SEARCH_DATASOURCES_DESCRIPTION,
  EMPTY_SEARCH_DATASOURCES_TITLE,
} from "ee/constants/messages";
import { useSelector } from "react-redux";
import { pluginSearchSelector } from "./CreateNewDatasourceHeader";
import { getPlugins, getUpcomingPlugins } from "ee/selectors/entitiesSelector";
import { getFilteredUpcomingIntegrations } from "./PremiumDatasources/Constants";
import styled from "styled-components";
import { filterSearch } from "./util";
import type { MockDatasource } from "entities/Datasource";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getAppsmithConfigs } from "ee/configs";

const EmptyImage = styled.img`
  margin-bottom: var(--ads-v2-spaces-6);
  width: 96px;
`;

export default function EmptySearchedPlugins({
  mockDatasources,
}: {
  mockDatasources: MockDatasource[];
}) {
  let searchedPlugin = useSelector((state) =>
    pluginSearchSelector(state, "search"),
  );

  const upcomingPlugins = useSelector(getUpcomingPlugins);

  searchedPlugin = (searchedPlugin || "").toLocaleLowerCase();
  const plugins = useSelector(getPlugins);

  // We are using this feature flag to identify whether its the enterprise/business user
  const isGACEnabled = useSelector((state) =>
    selectFeatureFlagCheck(state, FEATURE_FLAG.license_gac_enabled),
  );

  const { cloudHosting } = getAppsmithConfigs();

  const pluginNames = plugins.map((plugin) => plugin.name.toLocaleLowerCase());

  // Logic for EXTERNAL_SAAS integrations:
  // 1. For cloud instances:
  //    - If either release_external_saas_plugins_enabled OR license_external_saas_plugins_enabled is true: show as upcoming
  //    - If both are false: show as premium
  // 2. For self-hosted instances:
  //    - For non business/enterprise instances (GAC disabled): show Premium tag (regardless of flag values)
  //    - For business/enterprise instances (GAC enabled): always show integrations
  const shouldShowIntegrations = cloudHosting
    ? true // Always show for cloud instances (either as upcoming or premium)
    : isGACEnabled
      ? true // Always show for GAC-enabled instances
      : true;

  const searchedItems =
    filterSearch(
      [
        ...plugins,
        { name: createMessage(CREATE_NEW_DATASOURCE_AUTHENTICATED_REST_API) },
        ...mockDatasources,
        ...getFilteredUpcomingIntegrations(
          shouldShowIntegrations,
          pluginNames,
          upcomingPlugins,
        ),
      ],
      searchedPlugin,
    ).length > 0;

  if (searchedItems) return null;

  return (
    <Flex alignItems={"center"} flexDirection="column">
      <EmptyImage
        alt="empty search"
        src={getAssetUrl(`${ASSETS_CDN_URL}/empty-search.png`)}
      />
      <Text kind="heading-s">
        {createMessage(EMPTY_SEARCH_DATASOURCES_TITLE)}
      </Text>
      <Text>{createMessage(EMPTY_SEARCH_DATASOURCES_DESCRIPTION)}</Text>
    </Flex>
  );
}
