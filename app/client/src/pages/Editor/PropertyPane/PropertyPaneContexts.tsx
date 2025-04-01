import { createContext } from "react";

// Context is being provided to re-render anything that subscribes to this context on open and close
export const CollapseContext = createContext<boolean>(false);
