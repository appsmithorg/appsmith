type DefaultStylesheet = {
  [key: string]: string | DefaultStylesheet;
} & {
  childStylesheet?: AppThemeStylesheet;
};

export type Stylesheet<T = void> = T extends void
  ? DefaultStylesheet
  : T & DefaultStylesheet;

export type AppThemeStylesheet = {
  [key: string]: Stylesheet;
};

export type ButtonStyles = {
  resetButtonStyles: {
    [key: string]: string;
  };
  submitButtonStyles: {
    [key: string]: string;
  };
};

export type ChildStylesheet = {
  childStylesheet: AppThemeStylesheet;
};

export type AppTheme = {
  id: string;
  name: string;
  displayName: string;
  created_by: string;
  created_at: string;
  isSystemTheme?: boolean;
  // available values for particular type
  // NOTE: config represents options available and
  // properties represents the selected option
  config: {
    colors: {
      primaryColor: string;
      backgroundColor: string;
      [key: string]: string;
    };
    borderRadius: {
      [key: string]: {
        [key: string]: string;
      };
    };
    boxShadow: {
      [key: string]: {
        [key: string]: string;
      };
    };
    fontFamily: {
      [key: string]: string[];
    };
  };
  // styles for specific widgets
  stylesheet: AppThemeStylesheet;
  // current values for the theme
  properties: {
    colors: {
      primaryColor: string;
      backgroundColor: string;
      [key: string]: string;
    };
    borderRadius: {
      [key: string]: string;
    };
    boxShadow: {
      [key: string]: string;
    };
    fontFamily: {
      [key: string]: string;
    };
  };
};
