export const IDE_TYPE = {
  None: "None",
  App: "App",
  UIPackage: "UIPackage",
  Workspace: "Workspace",
} as const;

export type IDEType = keyof typeof IDE_TYPE;
