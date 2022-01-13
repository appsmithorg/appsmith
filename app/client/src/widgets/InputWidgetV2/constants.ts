export const InputTypes: { [key: string]: string } = {
  TEXT: "TEXT",
  NUMBER: "NUMBER",
  EMAIL: "EMAIL",
  PASSWORD: "PASSWORD",
};

export type InputType = typeof InputTypes[keyof typeof InputTypes];
