import { ThemeMode } from "../../selectors/themeSelectors";

export interface HeaderMetaState {
  hideHeaderShadow: boolean;
  showHeaderSeparator: boolean;
}

export type ThemeState = HeaderMetaState & {
  mode: ThemeMode;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme: any;
};

// Re-export for backward compatibility
export { ThemeMode };
