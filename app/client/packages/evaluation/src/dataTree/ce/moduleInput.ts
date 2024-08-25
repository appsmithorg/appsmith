export const generateDataTreeModuleInputs = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  moduleInputs: {
    id: string;
    children?: {
      id: string;
      propertyName: string;
    }[];
  }[],
) => {
  return {
    unEvalEntity: null,
    configEntity: null,
  };
};
