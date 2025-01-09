export type ActionSelectorReduxState = Record<
  string,
  {
    evaluatedValue: {
      value: string;
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errors: any[];
    };
  }
>;
