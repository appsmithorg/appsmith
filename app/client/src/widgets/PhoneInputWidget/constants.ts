export const InputTypes: { [key: string]: string } = {
  PHONE_NUMBER: "PHONE_NUMBER",
};

export type InputType = typeof InputTypes[keyof typeof InputTypes];
