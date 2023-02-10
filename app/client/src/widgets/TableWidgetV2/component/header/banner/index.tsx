import React from "react";
import { AddNewRowBanner, AddNewRowBannerType } from "./AddNewRowBanner";

export interface BannerPropType extends AddNewRowBannerType {
  isAddRowInProgress: boolean;
}

export function Banner(props: BannerPropType) {
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
