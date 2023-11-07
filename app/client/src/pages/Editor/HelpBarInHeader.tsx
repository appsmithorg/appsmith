import React from "react";
import classNames from "classnames";
import HelpBar from "components/editorComponents/GlobalSearch/HelpBar";
import { HeaderSection } from "./commons/EditorHeaderComponents";

export const HelperBarInHeader = ({
  isPreview = false,
}: {
  isPreview?: boolean;
}) => {
  return (
    <HeaderSection
      className={classNames({
        "-translate-y-full opacity-0": isPreview,
        "translate-y-0 opacity-100": !isPreview,
        "transition-all transform duration-400": true,
        "help-bar": "true",
      })}
    >
      <HelpBar />
    </HeaderSection>
  );
};
