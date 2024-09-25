import React from "react";
import type { AddNewRowBannerType } from "./AddNewRowBanner";
import { AddNewRowBanner } from "./AddNewRowBanner";

export interface BannerPropType extends AddNewRowBannerType {
  isAddRowInProgress: boolean;
}

function BannerComponent(props: BannerPropType) {
  return props.isAddRowInProgress ? (
    <AddNewRowBanner
      accentColor={props.accentColor}
      borderRadius={props.borderRadius}
      boxShadow={props.boxShadow}
      disabledAddNewRowSave={props.disabledAddNewRowSave}
      onAddNewRowAction={props.onAddNewRowAction}
    />
  ) : null;
}

export const Banner = React.memo(BannerComponent);
