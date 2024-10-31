import React from "react";

import { useLocation } from "react-router";
import { FlexLayout, type FlexLayoutProps } from "./FlexLayout";

export const MainCanvasWrapper = (props: FlexLayoutProps) => {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const isEmbed = queryParams.get("embed") === "true";

  return (
    <FlexLayout {...props} padding={isEmbed ? "spacing-0" : "spacing-4"}>
      {props.children}
    </FlexLayout>
  );
};
