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
import { PREMIUM_INTEGRATIONS } from "./PremiumDatasources/Constants";
import styled from "styled-components";

const EmptyImage = styled.img`
  margin-bottom: var(--ads-v2-spaces-6);
  width: 96px;
`;

export default function EmptySearchedPlugins({
  isPremiumDatasourcesViewEnabled,
}: {
  isPremiumDatasourcesViewEnabled: boolean;
}) {
  let searchedPlugin = useSelector((state) =>
    pluginSearchSelector(state, "search"),
  );

  searchedPlugin = (searchedPlugin || "").toLocaleLowerCase();
  const plugins = useSelector(getPlugins);
  let searchedItems = plugins.some((p) =>
    p.name.toLocaleLowerCase().includes(searchedPlugin),
  );

  searchedItems =
    searchedItems ||
    createMessage(CREATE_NEW_DATASOURCE_AUTHENTICATED_REST_API)
      .toLocaleLowerCase()
      .includes(searchedPlugin) ||
    (isPremiumDatasourcesViewEnabled &&
      PREMIUM_INTEGRATIONS.some((p) =>
        p.name.toLocaleLowerCase().includes(searchedPlugin),
      ));

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
