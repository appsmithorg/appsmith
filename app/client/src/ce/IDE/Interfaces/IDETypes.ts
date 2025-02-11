export const IDE_TYPE = {
  None: "None",
  App: "App",
} as const;

export type IDEType = keyof typeof IDE_TYPE;
