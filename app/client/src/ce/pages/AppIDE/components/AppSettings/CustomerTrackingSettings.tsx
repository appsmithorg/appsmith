import type { FC } from "react";
import type { Page } from "entities/Page";

// No tracking configuration controls are exposed by CE.
const CustomerTrackingSettings: FC<{
  page?: Page;
  isDisabled?: boolean;
}> = () => null;

export default CustomerTrackingSettings;
