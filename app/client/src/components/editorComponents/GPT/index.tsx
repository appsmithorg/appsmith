import React from "react";
import { Popover2 } from "@blueprintjs/popover2";
import { AskAI } from "./AskAI";

type TAIWrapperProps = {
  windowType: "popover" | "fixed";
  className?: string;
  outsideClick?: () => void;
  children?: React.ReactNode;
  isOpen?: boolean;
};

export function AIWindow(props: TAIWrapperProps) {
  const { className, isOpen, outsideClick, windowType } = props;
  if (windowType === "popover") {
    return (
      <Popover2
        canEscapeKeyClose
        className={`w-full h-full`}
        content={
          <div className="h-[500px] w-[400px] overflow-hidden">
            <AskAI onOutsideClick={outsideClick} />
          </div>
        }
        isOpen={isOpen}
        minimal
        popoverClassName="!translate-x-[-17px]"
        position="left"
      >
        {props.children}
      </Popover2>
    );
  } else {
    return (
      <div className={className}>
        <AskAI />
      </div>
    );
  }
}
