import { createContext } from "react";

// Context is being provided to re-render anything that subscribes to this context on open and close
export const CollapseContext = createContext<boolean>(false);
// Context for propagating the disabled state from section to child controls
export const DisabledContext = createContext<boolean>(false); 