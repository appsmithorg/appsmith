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

  const isExternalSaasEnabled = useSelector((state) =>
    selectFeatureFlagCheck(
      state,
      FEATURE_FLAG.release_external_saas_plugins_enabled,
    ),
  );
  const isLicenseExternalSaasEnabled = useSelector((state) =>
    selectFeatureFlagCheck(
      state,
      FEATURE_FLAG.license_external_saas_plugins_enabled,
    ),
  );

  // We are using this feature flag to identify whether its the enterprise/business user
  const isGACEnabled = useSelector((state) =>
    selectFeatureFlagCheck(state, FEATURE_FLAG.license_gac_enabled),
  );

  const pluginNames = plugins.map((plugin) => plugin.name.toLocaleLowerCase());

  // Logic for EXTERNAL_SAAS integrations:
  // These integrations are only available for business and enterprise instances.
  // For non business/enterprise instances (GAC disabled): show Premium tag (regardless of flag values)
  // For business/enterprise instances (GAC enabled): show in upcoming section when either release OR license flag is true
  const shouldShowIntegrations = isGACEnabled
    ? isExternalSaasEnabled || isLicenseExternalSaasEnabled
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
