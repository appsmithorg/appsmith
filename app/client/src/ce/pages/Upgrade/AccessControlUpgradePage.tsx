import React from "react";
import { Header } from "./types";
import UpgradePage from "./UpgradePage";

export function AccessControlUpgradePage() {
  const header: Header = {
    heading: "Access Control",
    subHeadings: ["sub heading 1", "sub heading 2"],
  };
  const carousel = {
    triggers: [
      {
        icon: "lock-2-line",
        heading: "heading",
        details: ["details"],
      },
      {
        icon: "search-eye-line",
        heading: "heading",
        details: ["details"],
      },
      {
        icon: "alert-line",
        heading: "heading",
        details: ["details"],
      },
    ],
    targets: ["first", "second", "third"],
  };
  const footer = {
    onClick: () => null,
    message: "Access control not published yet!",
  };
  const props = { header, carousel, footer };
  return <UpgradePage {...props} />;
}
