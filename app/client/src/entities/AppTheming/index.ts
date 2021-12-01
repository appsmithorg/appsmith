export interface AppTheme {
  config: {
    colors: {
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
    boxShadowColor: {
      [key: string]: string;
    };
    fontFamily: {
      [key: string]: {
        [key: string]: [string, string];
      };
    };
  };
  stylesheet: {
    [key: string]: string;
  };
  properties: {
    colors: {
      [key: string]: string;
    };
    borderRadius: {
      [key: string]: string;
    };
    boxShadow: {
      [key: string]: string;
    };
    boxShadowColor: {
      [key: string]: string;
    };
    fontFamily: {
      [key: string]: [string, string];
    };
  };
  variants: {
    [key: string]: string;
  };
}
