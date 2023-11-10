import React from "react";
import { PluginPackageName } from "entities/Action";
import { CurlIconV2, GraphQLIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import { getQueryParams } from "utils/URLUtils";
import history from "utils/history";
import { curlImportPageURL } from "@appsmith/RouteBuilder";
import {
  SEARCH_ITEM_TYPES,
  type ActionOperation,
} from "components/editorComponents/GlobalSearch/utils";
import { createQueryModule } from "@appsmith/actions/moduleActions";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";

export const actionOperations: ActionOperation[] = [
  {
    title: "New blank API",
    desc: "Create a new API",
    kind: SEARCH_ITEM_TYPES.actionOperation,
    action: (packageId: string, from: EventLocation) =>
      createQueryModule({
        packageId,
        from,
        type: MODULE_TYPE.QUERY,
      }),
  },
  {
    title: "New blank GraphQL API",
    desc: "Create a new API",
    icon: <GraphQLIconV2 />,
    kind: SEARCH_ITEM_TYPES.actionOperation,
    action: (packageId: string, from: EventLocation) =>
      createQueryModule({
        packageId,
        from,
        type: MODULE_TYPE.QUERY,
        apiType: PluginPackageName.GRAPHQL,
      }),
  },
  {
    title: "New cURL import",
    desc: "Import a cURL Request",
    kind: SEARCH_ITEM_TYPES.actionOperation,
    icon: <CurlIconV2 />,
    redirect: (packageId: string, from: EventLocation) => {
      const queryParams = getQueryParams();
      const curlImportURL = curlImportPageURL({
        pageId: packageId, // ankita: update later
        params: {
          from,
          ...queryParams,
        },
      });
      history.push(curlImportURL);
    },
  },
];
