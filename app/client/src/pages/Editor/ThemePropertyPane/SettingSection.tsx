import * as Sentry from "@sentry/react";
import React, { useState } from "react";
import { Collapse } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import Icon from "components/ads/AppIcon";
import { Size } from "design-system";

const SettingsWrapper = styled.div`
  .bp3-collapse,
  .bp3-collapse-body {
    transition: none;
  }
`;

const StyledIcon = styled(Icon)`
  svg path {
    fill: ${Colors.GREY_7};
  }
`;

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
    <SettingsWrapper className={className}>
      <div
        className={` cursor-pointer flex items-center justify-between capitalize text-sm text-gray-800 `}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <div className="font-medium">{props.title}</div>
        {collapsible && (
          <StyledIcon
            name={isOpen ? "arrow-down" : "arrow-right"}
            size={Size.small}
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
