import type { FC } from "react";

export interface EditorRoute {
  component: FC;
  exact?: boolean;
  key: string;
  path: string;
}

export interface EditorProps {
  path?: string;
  exact?: boolean;
}
