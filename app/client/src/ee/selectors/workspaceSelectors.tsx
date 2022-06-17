export * from "ce/selectors/workspaceSelectors";

// Note: this value will come from a organisation setting later on
// But for now, it will be false for EE
export const getShowBrandingBadge = () => {
  return false;
};
