import React from "react";
import clsx from "classnames";
import { useSelector } from "react-redux";

import type { PagePaneDataObject } from "@appsmith/selectors/entitiesSelector";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import { useActiveAction } from "@appsmith/pages/Editor/Explorer/hooks";
import { jsCollectionIdURL } from "@appsmith/RouteBuilder";
import history, { NavigationMethod } from "utils/history";
import { StyledTab } from "./StyledComponents";

const JSTab = ({ data }: { data: PagePaneDataObject }) => {
  const activeActionId = useActiveAction();
  const pageId = useSelector(getCurrentPageId);

  const navigateToJSCollection = () => {
    const navigateToUrl = jsCollectionIdURL({
      pageId,
      collectionId: data.id,
      params: {},
    });

    history.push(navigateToUrl, {
      invokedBy: NavigationMethod.EditorTabs,
    });
  };

  return (
    <StyledTab
      className={clsx("editor-tab", activeActionId === data.id && "active")}
      onClick={navigateToJSCollection}
    >
      {data.name}
    </StyledTab>
  );
};

export { JSTab };
