import { RestAction } from "../api/ActionAPI";

export const normalizeApiFormData = (formData: any): RestAction => {
  return {
    ...formData,
    actionConfiguration: {
      ...formData.actionConfiguration,
      body: formData.actionConfiguration.body
        ? typeof formData.actionConfiguration.body === "string"
          ? JSON.parse(formData.actionConfiguration.body)
          : formData.actionConfiguration.body
        : null,
    },
  };
};
