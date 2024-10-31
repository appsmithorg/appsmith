import React from "react";
import { FlexLayout, type FlexLayoutProps } from "./FlexLayout";

export const MainCanvasWrapper = (props: FlexLayoutProps) => {
  const { search } = window.location;
  const queryParams = new URLSearchParams(search);
  const isEmbed = queryParams.get("embed") === "true";

  return (
    <FlexLayout {...props} padding={isEmbed ? "spacing-0" : "spacing-4"}>
      {props.children}
    </FlexLayout>
  );
};
