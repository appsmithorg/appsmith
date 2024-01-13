import { AppsmithFrameAncestorsSetting } from "../Constants/constants";

export const formatEmbedSettings = (value: string) => {
  if (value === "*") {
    return {
      value: AppsmithFrameAncestorsSetting.ALLOW_EMBEDDING_EVERYWHERE,
    };
  } else if (value === "'none'") {
    return {
      value: AppsmithFrameAncestorsSetting.DISABLE_EMBEDDING_EVERYWHERE,
    };
  } else {
    return {
      value: AppsmithFrameAncestorsSetting.LIMIT_EMBEDDING,
      additionalData: value ? value.replaceAll(" ", ",") : "",
    };
  }
};
