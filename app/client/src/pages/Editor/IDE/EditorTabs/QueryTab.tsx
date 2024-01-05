import React, { useMemo } from "react";
import clsx from "classnames";
import { useSelector } from "react-redux";

import type { PagePaneDataObject } from "@appsmith/selectors/entitiesSelector";
import { getAction } from "@appsmith/selectors/entitiesSelector";
import { getPlugins } from "@appsmith/selectors/entitiesSelector";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import history, { NavigationMethod } from "utils/history";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import type { Action } from "entities/Action";
import keyBy from "lodash/keyBy";
import { StyledTab } from "./StyledComponents";

const QueryTab = ({ data }: { data: PagePaneDataObject }) => {
  const activeActionId = useActiveAction();
  const pageId = useSelector(getCurrentPageId);
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const action = useSelector((state) => getAction(state, data.id)) as Action;

  const config = getActionConfig(data.type);
  const url = config?.getURL(
    pageId,
    action.id,
    action.pluginType,
    pluginGroups[action.pluginId],
  );

  const navigateToQuery = () => {
    url && history.push(url, { invokedBy: NavigationMethod.EditorTabs });
  };

  return (
    <StyledTab
      className={clsx("editor-tab", activeActionId === data.id && "active")}
      onClick={navigateToQuery}
    >
      {data.name}
    </StyledTab>
  );
};

export { QueryTab };
