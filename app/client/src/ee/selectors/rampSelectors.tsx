export * from "ce/selectors/rampSelectors";
import { showProductRamps as CE_showProductRamps } from "ce/selectors/rampSelectors";
import { createSelector } from "reselect";

// useCESelector is a boolean flag that is used to determine whether to use the CE selector or the EE selector
// this is introduced since some ramps need to be shown in EE also
export const showProductRamps = (rampName: string, useCESelector = false) =>
  useCESelector
    ? CE_showProductRamps(rampName)
    : createSelector(
        () => null,
        () => {
          return false;
        },
      );
