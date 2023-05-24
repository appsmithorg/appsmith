export * from "ce/components/editorComponents/GPT/trigger";

import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import classNames from "classnames";
import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { getEntityInCurrentPath } from "sagas/RecentEntitiesSagas";
import { selectIsAIWindowOpen } from "./utils";
import { selectFeatureFlags } from "selectors/usersSelectors";
import { getActionsForCurrentPage } from "selectors/entitiesSelector";
import { Icon } from "design-system";

export const askAIEnabled = true;
export const APPSMITH_AI = "AI";

export function GPTTrigger() {
  const dispatch = useDispatch();
  const location = useLocation();
  const pageInfo = useMemo(
    () => getEntityInCurrentPath(location.pathname),
    [location.pathname],
  );
  const { id, pageType } = pageInfo || {};
  const actions = useSelector(getActionsForCurrentPage);
  const featureFlags = useSelector(selectFeatureFlags);
  let hide =
    !["jsEditor", "canvas", "queryEditor"].includes(pageType || "") ||
    !featureFlags.ask_ai;
  const windowOpen = useSelector(selectIsAIWindowOpen);
  if (pageType === "queryEditor") {
    const action = actions.find((action) => action.config.id === id);
    // If the action is not a SQL query, hide the AI button
    if (action?.config.actionConfiguration.hasOwnProperty("formData")) {
      hide = true;
    }
  }

  const toggleWindow = () => {
    dispatch({
      type: ReduxActionTypes.TOGGLE_AI_WINDOW,
      payload: { show: !windowOpen },
    });
  };
  return (
    <div
      className={classNames({
        "flex flex-row gap-1 px-4 h-full items-center border-l border-l-[#E7E7E7] cursor-pointer hover:bg-[#F1F1F1]":
          true,
        hidden: hide,
      })}
      onClick={toggleWindow}
    >
      <Icon name="enterprise" size="md" />
      <span className="text-xs">Ask AI</span>
    </div>
  );
}
