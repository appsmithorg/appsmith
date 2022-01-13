export const InputTypes: { [key: string]: string } = {
  CURRENCY: "CURRENCY",
};

export type InputType = typeof InputTypes[keyof typeof InputTypes];
