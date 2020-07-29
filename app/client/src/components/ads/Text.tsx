import React from "react";

export type TextProps = {
  type: "p1" | "p2" | "p3" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  underline: boolean;
  italic: boolean;
};

export default function Text(props: TextProps) {
  return <span></span>;
}
