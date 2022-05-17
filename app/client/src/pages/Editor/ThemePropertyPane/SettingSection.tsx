import * as Sentry from "@sentry/react";
import React, { useState } from "react";
import { Collapse } from "@blueprintjs/core";
import ArrowRight from "remixicon-react/ArrowRightSLineIcon";

interface SettingSectionProps {
  isDefaultOpen?: boolean;
  className?: string;
  title: string;
  children?: React.ReactNode;
  collapsible?: boolean;
}

export function SettingSection(props: SettingSectionProps) {
  const { className = "", collapsible = true } = props;
  const [isOpen, setOpen] = useState(props.isDefaultOpen);

  return (
    <div className={className}>
      <div
        className={` cursor-pointer flex items-center justify-between capitalize text-base text-gray-800 `}
        onClick={() => setOpen((isOpen) => !isOpen)}
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
