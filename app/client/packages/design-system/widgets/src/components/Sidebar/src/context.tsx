import * as React from "react";
import type { SidebarContextType } from "./types";

export const SidebarContext = React.createContext<SidebarContextType | null>(
  null,
);
