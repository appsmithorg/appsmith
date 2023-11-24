import React, { memo } from "react";
import type { AddNewRowBannerType } from "./AddNewRowBanner";
import { AddNewRowBanner } from "./AddNewRowBanner";

export interface BannerPropType extends AddNewRowBannerType {}

export const Banner = memo((props: BannerPropType) => (
  <AddNewRowBanner
    disabledAddNewRowSave={props.disabledAddNewRowSave}
    onAddNewRowAction={props.onAddNewRowAction}
  />
));
