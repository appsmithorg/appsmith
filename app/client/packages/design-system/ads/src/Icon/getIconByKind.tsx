import React from "react";
import { Icon } from "./Icon";
import type { Kind } from "../__config__/types";

export function getIconByKind(kind: Kind) {
  switch (kind) {
    case "success":
      return (
        <Icon
          color="var(--ads-v2-colors-response-success-icon-default-fg)"
          name="oval-check-fill"
          size="lg"
        />
      );

    case "error":
      return (
        <Icon
          color="var(--ads-v2-colors-response-error-icon-default-fg)"
          name="close-circle"
          size="lg"
        />
      );

    case "warning":
      return (
        <Icon
          color="var(--ads-v2-colors-response-warning-icon-default-fg)"
          name="alert-fill"
          size="lg"
        />
      );

    case "info":
      return (
        <Icon
          color="var(--ads-v2-colors-response-info-icon-default-fg)"
          name="info-fill"
          size="lg"
        />
      );

    // TODO: handle errors here
    default:
      return null;
  }
}
