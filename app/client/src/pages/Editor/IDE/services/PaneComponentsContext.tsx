import React, { createContext, useContext } from "react";

interface PaneComponents {
  LeftPane: React.ComponentType;
  RightPane: React.ComponentType;
  MainPane: React.ComponentType<{ id: string }>;
  Sidebar: React.ComponentType;
}

const PaneComponentsContext = createContext<PaneComponents | null>(null);

export function PaneComponentsProvider({
  children,
  components,
}: {
  children: React.ReactNode;
  components: PaneComponents;
}) {
  return (
    <PaneComponentsContext.Provider value={components}>
      {children}
    </PaneComponentsContext.Provider>
  );
}

export function usePaneComponents() {
  const context = useContext(PaneComponentsContext);
  if (!context) {
    throw new Error("usePaneComponents must be used within PaneComponentsProvider");
  }
  return context;
}
