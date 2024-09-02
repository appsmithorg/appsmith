import * as Sentry from "@sentry/react";
import type { ComponentPropsWithoutRef } from "react";
import React, { useState } from "react";
import { Collapse } from "@blueprintjs/core";
import styled from "styled-components";
import { Icon } from "@appsmith/ads";

const SettingsWrapper = styled.div`
  color: var(--ads-v2-color-fg);

  .bp3-collapse,
  .bp3-collapse-body {
    transition: none;
  }
`;

const Title = styled.p`
  font-size: var(--ads-v2-font-size-4);
  line-height: 1.2rem;
  font-weight: var(--ads-v2-font-weight-bold);
  color: var(--ads-v2-color-fg-emphasis);
`;

interface SettingSectionProps extends ComponentPropsWithoutRef<"div"> {
  isDefaultOpen?: boolean;
  className?: string;
  title: string;
  children?: React.ReactNode;
  collapsible?: boolean;
}

export function SettingSection(props: SettingSectionProps) {
  const { className = "", collapsible = true, isDefaultOpen, ...rest } = props;
  const [isOpen, setOpen] = useState(isDefaultOpen);

  return (
    <SettingsWrapper className={className} {...rest}>
      <div
        className={` cursor-pointer flex items-center justify-between capitalize text-sm`}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <Title>{props.title}</Title>
        {collapsible && (
          <Icon
            name={isOpen ? "arrow-down-s-line" : "arrow-right-s-line"}
            size="sm"
          />
        )}
      </div>
      <Collapse isOpen={isOpen} transitionDuration={0}>
        <div className="pt-2 pb-1 space-y-3">{props.children}</div>
      </Collapse>
    </SettingsWrapper>
  );
}

SettingSection.displayName = "SettingSection";

export default Sentry.withProfiler(SettingSection);
