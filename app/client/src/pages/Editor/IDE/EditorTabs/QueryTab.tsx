import React, { useMemo } from "react";
import clsx from "classnames";
import { useSelector } from "react-redux";
import { Tooltip } from "design-system";
import styled from "styled-components";

import type { EntityItem } from "@appsmith/entities/IDE/constants";
import {
  getAction,
  getPlugins,
  getCurrentPageId,
  getPlugin,
} from "@appsmith/selectors/entitiesSelector";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import history, { NavigationMethod } from "utils/history";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import type { Action } from "entities/Action";
import keyBy from "lodash/keyBy";
import { StyledTab, TabTextContainer } from "./StyledComponents";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

const StyledIconContainer = styled.div`
  height: 12px;
  width: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    width: 12px;
  }
`;

const QueryTab = ({ data }: { data: EntityItem }) => {
  const activeActionId = useActiveAction();
  const pageId = useSelector(getCurrentPageId);
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const action = useSelector((state) => getAction(state, data.key)) as Action;
  const currentPlugin = useSelector((state) =>
    getPlugin(state, action?.pluginId || ""),
  );

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
      className={clsx("editor-tab", activeActionId === data.key && "active")}
      onClick={navigateToQuery}
    >
      {currentPlugin && (
        <StyledIconContainer>
          <img
            alt={currentPlugin.name}
            src={getAssetUrl(currentPlugin?.iconLocation)}
          />
        </StyledIconContainer>
      )}
      <Tooltip content={data.title} mouseEnterDelay={1}>
        <TabTextContainer>{data.title}</TabTextContainer>
      </Tooltip>
    </StyledTab>
  );
};

export { QueryTab };
