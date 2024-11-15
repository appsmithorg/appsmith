import * as React from "react";
import { Button } from "@appsmith/wds";

import { useSidebar } from "./use-sidebar";

interface SidebarTriggerProps {
  onPress?: () => void;
}

export const SidebarTrigger = (props: SidebarTriggerProps) => {
  const { onPress } = props;
  const { state, toggleSidebar } = useSidebar();

  return (
    <Button
      color="neutral"
      icon={
        state === "expanded"
          ? "layout-sidebar-right-collapse"
          : "layout-sidebar-left-collapse"
      }
      onPress={() => {
        onPress?.();
        toggleSidebar();
      }}
      variant="ghost"
    />
  );
};
