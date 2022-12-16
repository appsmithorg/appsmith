import * as Sentry from "@sentry/react";
import React, { useState } from "react";
import { Collapse } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { AppIcon as Icon, Size } from "design-system";

const SettingsWrapper = styled.div`
  color: ${Colors.GRAY_700};

  .bp3-collapse,
  .bp3-collapse-body {
    transition: none;
  }
`;

const StyledIcon = styled(Icon)`
  svg path {
    fill: ${Colors.GRAY_700};
  }
`;

const Title = styled.div`
  color: ${Colors.GRAY_800};
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
        className={` cursor-pointer flex items-center justify-between capitalize text-sm`}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <Title className="font-medium">{props.title}</Title>
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
