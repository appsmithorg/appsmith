import type { ComponentType, LazyExoticComponent } from "react";

export interface EditorRoute {
  component: LazyExoticComponent<ComponentType<any>>;
  exact?: boolean;
  key: string;
  path: string;
}

export interface EditorProps {
  path?: string;
  exact?: boolean;
}
