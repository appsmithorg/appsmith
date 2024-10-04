import React from "react";

jest.mock("react-markdown", () => (props: { children: unknown }) => {
  return <>{props.children}</>;
});
