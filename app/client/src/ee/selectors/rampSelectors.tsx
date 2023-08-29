export * from "ce/selectors/rampSelectors";
import { createSelector } from "reselect";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const showProductRamps = (rampName: string) =>
  createSelector(
    () => null,
    () => {
      return false;
    },
  );
