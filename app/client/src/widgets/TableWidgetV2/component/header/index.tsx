import React from "react";
import Actions, { ActionsPropsType } from "./actions";
import { Banner, BannerPropType } from "./banner";

function TableHeader(props: ActionsPropsType & BannerPropType) {
  const {
    accentColor,
    addNewRowInProgress,
    borderRadius,
    boxShadow,
    disabledAddNewRowSave,
    onAddNewRowAction,
    ...ActionProps
  } = props;

  return addNewRowInProgress ? (
    <Banner
      accentColor={accentColor}
      addNewRowInProgress={addNewRowInProgress}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      disabledAddNewRowSave={disabledAddNewRowSave}
      onAddNewRowAction={onAddNewRowAction}
    />
  ) : (
    <Actions
      accentColor={accentColor}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      {...ActionProps}
    />
  );
}

export default TableHeader;
