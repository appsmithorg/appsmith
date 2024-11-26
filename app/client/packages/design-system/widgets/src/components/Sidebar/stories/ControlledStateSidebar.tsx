import React, { useState } from "react";
import {
  Sidebar,
  SidebarTrigger,
  SidebarProvider,
  type SidebarState,
} from "../src/index";
import { Flex } from "../../Flex";

type ControlledStateSidebarProps = SidebarProps & {
  children: React.ReactNode;
};

export const ControlledStateSidebar = (props: ControlledStateSidebarProps) => {
  const { children, ...sidebarProps } = props;
  const [state, setState] = useState<SidebarState>("collapsed");

  return (
    <SidebarProvider
      onStateChange={setState}
      side="start"
      state={state}
      style={{
        height: "50vh",
        border: "1px solid var(--color-bd-elevation-1)",
      }}
    >
      <Sidebar {...sidebarProps}>{children}</Sidebar>
      <Flex alignItems="start" margin="spacing-4" width="100%">
        <SidebarTrigger />
      </Flex>
    </SidebarProvider>
  );
};
