export * from "ce/utils/preloadHelpers";

export const getBaseURL = () => {
  return (window as any).CDN_URL || "/";
};
