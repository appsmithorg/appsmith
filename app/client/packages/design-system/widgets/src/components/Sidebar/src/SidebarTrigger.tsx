import * as React from "react";
import { Button } from "@appsmith/wds";

import { useSidebar } from "./use-sidebar";

interface SidebarTriggerProps {
  onPress?: () => void;
}

export const SidebarTrigger = (props: SidebarTriggerProps) => {
  const { onPress } = props;
  const { side, state, toggleSidebar } = useSidebar();

  return (
    <Button
      color="neutral"
      icon={
        state === "collapsed"
          ? side === "start"
            ? "layout-sidebar-left-expand"
            : "layout-sidebar-right-expand"
          : side === "start"
            ? "layout-sidebar-left-collapse"
            : "layout-sidebar-right-collapse"
      }
      onPress={() => {
        onPress?.();
        toggleSidebar();
      }}
      variant="ghost"
    />
  );
};
