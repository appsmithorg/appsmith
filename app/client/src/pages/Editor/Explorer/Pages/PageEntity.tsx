import React, { useCallback } from "react";
import ExplorerWidgetGroup from "../Widgets/WidgetGroup";
import Files from "../Files";

type ExplorerPageEntityProps = {
  pageId: string;
  step: number;
  searchKeyword?: string;
  showWidgetsSidebar: (pageId: string) => void;
};

export function ExplorerPageEntity(props: ExplorerPageEntityProps) {
  const addWidgetsFn = useCallback(
    () => props.showWidgetsSidebar(props.pageId),
    [props.pageId],
  );

  return (
    <div>
      <ExplorerWidgetGroup
        addWidgetsFn={addWidgetsFn}
        pageId={props.pageId}
        searchKeyword={props.searchKeyword}
        step={props.step + 1}
      />

      <Files pageId={props.pageId} />
    </div>
  );
}

ExplorerPageEntity.displayName = "ExplorerPageEntity";

export default ExplorerPageEntity;
