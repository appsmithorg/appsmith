import React from "react";
import clsx from "classnames";
import { useSelector } from "react-redux";

import type { EntityItem } from "@appsmith/entities/IDE/constants";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import { jsCollectionIdURL } from "@appsmith/RouteBuilder";
import history, { NavigationMethod } from "utils/history";
import { StyledTab, TabTextContainer } from "./StyledComponents";
import { JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { Tooltip } from "design-system";

const JSTab = ({ data }: { data: EntityItem }) => {
  const activeActionId = useActiveAction();
  const pageId = useSelector(getCurrentPageId);

  const navigateToJSCollection = () => {
    const navigateToUrl = jsCollectionIdURL({
      pageId,
      collectionId: data.key,
      params: {},
    });

    history.push(navigateToUrl, {
      invokedBy: NavigationMethod.EditorTabs,
    });
  };

  return (
    <StyledTab
      className={clsx("editor-tab", activeActionId === data.key && "active")}
      onClick={navigateToJSCollection}
    >
      {JsFileIconV2(12, 12)}
      <Tooltip content={data.title} mouseEnterDelay={1}>
        <TabTextContainer>{data.title}</TabTextContainer>
      </Tooltip>
    </StyledTab>
  );
};

export { JSTab };
