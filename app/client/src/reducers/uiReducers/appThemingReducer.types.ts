import type { AppTheme } from "../../entities/AppTheming";
import type { AppThemingMode } from "../../selectors/appThemingSelectors";

export interface AppThemingState {
  isSaving: boolean;
  isChanging: boolean;
  stack: AppThemingMode[];
  selectedTheme: AppTheme;
  themes: AppTheme[];
  themesLoading: boolean;
  selectedThemeLoading: boolean;
  isBetaCardShown: boolean;
}
