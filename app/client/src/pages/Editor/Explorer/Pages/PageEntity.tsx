import React from "react";
import ExplorerWidgetGroup from "../Widgets/WidgetGroup";
import Files from "../Files";

type ExplorerPageEntityProps = {
  step: number;
  searchKeyword?: string;
  showWidgetsSidebar: () => void;
};

export function ExplorerPageEntity(props: ExplorerPageEntityProps) {
  return (
    <div>
      <ExplorerWidgetGroup
        addWidgetsFn={props.showWidgetsSidebar}
        searchKeyword={props.searchKeyword}
        step={props.step}
      />

      <Files />
    </div>
  );
}

ExplorerPageEntity.displayName = "ExplorerPageEntity";

export default ExplorerPageEntity;
