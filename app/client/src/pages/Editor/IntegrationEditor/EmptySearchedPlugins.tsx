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
import { getPlugins } from "ee/selectors/entitiesSelector";
import { getFilteredPremiumIntegrations } from "./PremiumDatasources/Constants";
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
  isPremiumDatasourcesViewEnabled,
  mockDatasources,
}: {
  isPremiumDatasourcesViewEnabled: boolean;
  mockDatasources: MockDatasource[];
}) {
  let searchedPlugin = useSelector((state) =>
    pluginSearchSelector(state, "search"),
  );

  searchedPlugin = (searchedPlugin || "").toLocaleLowerCase();
  const plugins = useSelector(getPlugins);

  const isExternalSaasEnabled = useSelector((state) =>
    selectFeatureFlagCheck(
      state,
      FEATURE_FLAG.release_external_saas_plugins_enabled,
    ),
  );

  const searchedItems =
    filterSearch(
      [
        ...plugins,
        { name: createMessage(CREATE_NEW_DATASOURCE_AUTHENTICATED_REST_API) },
        ...mockDatasources,
        ...(isPremiumDatasourcesViewEnabled
          ? getFilteredPremiumIntegrations(isExternalSaasEnabled)
          : []),
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
