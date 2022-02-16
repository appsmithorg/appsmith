import * as Sentry from "@sentry/react";
import { Collapse } from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import ArrowRight from "remixicon-react/ArrowRightSLineIcon";

interface SettingSectionProps {
  isOpen?: boolean;
  className?: string;
  title: string;
  children?: React.ReactNode;
  collapsible?: boolean;
}

export function SettingSection(props: SettingSectionProps) {
  const { className = "", collapsible = true } = props;
  const [isOpen, setOpen] = useState(props.isOpen);

  /**
   * toggles the collapsible section
   */
  const toggleCollapse = useCallback(() => {
    setOpen(!isOpen);
  }, [setOpen, isOpen]);

  return (
    <div className={`${className}`}>
      <div
        className={` cursor-pointer flex items-center justify-between capitalize text-base text-gray-800 `}
        onClick={toggleCollapse}
      >
        <div className="font-normal">{props.title}</div>
        {collapsible && (
          <div>
            <ArrowRight
              className={` transform transition-all ${
                isOpen ? "-rotate-90" : "rotate-90"
              }`}
            />
          </div>
        )}
      </div>
      <Collapse isOpen={isOpen}>
        <div className="pt-2 space-y-3">{props.children}</div>
      </Collapse>
    </div>
  );
}

SettingSection.displayName = "SettingSection";

export default Sentry.withProfiler(SettingSection);
