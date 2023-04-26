export * from "ce/utils/airgapHelpers";
import { getAppsmithConfigs } from "@appsmith/configs";

const { airGapped } = getAppsmithConfigs();

export const getAssetUrl = (src = "") => {
  if (typeof src !== "string") {
    return src;
  }
  const isRemoteImage =
    src && (src.startsWith("http") || src.startsWith("https"));

  if (airGapped && isRemoteImage) {
    const splitSrc = src.split("/");
    return `${window.location.origin}/${splitSrc[splitSrc.length - 1]}`;
  } else {
    return src;
  }
};

export const isAirgapped = () => {
  return airGapped;
};
