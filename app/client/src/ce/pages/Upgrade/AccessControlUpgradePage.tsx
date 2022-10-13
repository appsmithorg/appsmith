import React from "react";
import { Header } from "./types";
import UpgradePage from "./UpgradePage";

export function AccessControlUpgradePage() {
  const header: Header = {
    heading: "Access Control",
    subHeadings: ["First of all, how dare you?", "Oh God NO! No! No! God No!"],
  };
  const carousel = {
    triggers: [
      {
        icon: "lock-2-line",
        heading: "heading",
        details: ["blah blah blah"],
      },
      {
        icon: "search-eye-line",
        heading: "heading",
        details: ["blah blah blah"],
      },
      {
        icon: "alert-line",
        heading: "heading",
        details: ["blah blah blah"],
      },
    ],
    targets: ["first", "second", "third"],
  };
  const footer = {
    onClick: () => null,
    message: "Access control no bueno!",
  };
  const props = { header, carousel, footer };
  return <UpgradePage {...props} />;
}
