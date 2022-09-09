type Stylesheet = {
  [key: string]: {
    [key: string]: string;
  };
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
  stylesheet: {
    [key: string]: {
      [key: string]:
        | string
        | Stylesheet
        | {
            [key: string]: string;
          };
      childStylesheet: Stylesheet;
      resetButtonStyles: {
        [key: string]: string;
      };
      submitButtonStyles: {
        [key: string]: string;
      };
    };
  };
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
