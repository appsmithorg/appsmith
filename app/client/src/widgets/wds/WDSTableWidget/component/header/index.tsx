import React from "react";

import { Banner } from "./banner";
import { Actions } from "./actions";
import type { BannerPropType } from "./banner";
import type { ActionsPropsType } from "./actions";

interface TableHeaderProps extends ActionsPropsType, BannerPropType {
  isAddRowInProgress: boolean;
}

function TableHeader(props: TableHeaderProps) {
  const {
    disabledAddNewRowSave,
    isAddRowInProgress,
    onAddNewRowAction,
    ...rest
  } = props;

  if (isAddRowInProgress) {
    return (
      <Banner
        disabledAddNewRowSave={disabledAddNewRowSave}
        onAddNewRowAction={onAddNewRowAction}
      />
    );
  }

  return <Actions {...rest} />;
}

export { TableHeader };
