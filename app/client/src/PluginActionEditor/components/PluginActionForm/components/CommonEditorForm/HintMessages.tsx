import React from "react";
import { Callout } from "@appsmith/ads";

export function HintMessages(props: { hintMessages: string[] }) {
  if (props.hintMessages.length === 0) {
    return null;
  }

  return (
    <>
      {props.hintMessages.map((msg, i) => (
        <Callout key={i} kind="info">
          {msg}
        </Callout>
      ))}
    </>
  );
}
