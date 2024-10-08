import React from "react";
import type { ActionsPropsType } from "./actions";
import Actions from "./actions";
import type { BannerPropType } from "./banner";
import { Banner } from "./banner";

function TableHeader(props: ActionsPropsType & BannerPropType) {
  const {
    accentColor,
    borderRadius,
    boxShadow,
    disabledAddNewRowSave,
    isAddRowInProgress,
    onAddNewRowAction,
    enableClientSideSearch,
    ...ActionProps
  } = props;

  return isAddRowInProgress ? (
    <Banner
      accentColor={accentColor}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      disabledAddNewRowSave={disabledAddNewRowSave}
      isAddRowInProgress={isAddRowInProgress}
      onAddNewRowAction={onAddNewRowAction}
    />
  ) : (
    <Actions
      enableClientSideSearch={enableClientSideSearch}
      accentColor={accentColor}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      {...ActionProps}
    />
  );
}

export default TableHeader;
