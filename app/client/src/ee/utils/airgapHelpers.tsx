export * from "ce/utils/airgapHelpers";
import { getAppsmithConfigs } from "@appsmith/configs";

const { airGapped } = getAppsmithConfigs();

export const getAssetUrl = (src = "") => {
  const isRemoteImage =
    src && (src.startsWith("http") || src.startsWith("https"));

  if (airGapped && isRemoteImage) {
    const splitSrc = src.split("/");
    return `/${splitSrc[splitSrc.length - 1]}`;
  } else {
    return src;
  }
};

export const isAirgapped = () => {
  return airGapped;
};
