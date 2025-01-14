import React, { useCallback } from "react";
import { Icon } from "../../../Icon";
import { Text } from "../../../Text";
import { Tooltip } from "../../../Tooltip";

import type { Condition } from "../enums";
import { ConditionConfig } from "./constants";
import * as Styled from "./styles";

export interface SidebarButtonProps {
  title?: string;
  testId: string;
  selected: boolean;
  icon: string;
  onClick: (urlSuffix: string) => void;
  urlSuffix: string;
  tooltip?: string;
  condition?: Condition;
}

function SidebarButton(props: SidebarButtonProps) {
  const { condition, icon, onClick, selected, title, tooltip, urlSuffix } =
    props;
  const handleOnClick = useCallback(() => {
    if (!selected) {
      onClick(urlSuffix);
    }
  }, [selected, onClick, urlSuffix]);

  return (
    <Styled.Container>
      <Tooltip
        content={tooltip}
        isDisabled={!!title && !tooltip}
        placement={"right"}
      >
        <Styled.IconContainer
          className={`t--sidebar-${title || tooltip}`}
          data-selected={selected}
          data-testid={"t--sidebar-" + props.testId}
          onClick={handleOnClick}
          role="button"
        >
          <Icon name={icon} size="lg" />
          {condition && (
            <Styled.ConditionIcon
              className={`t--sidebar-${condition}-condition-icon`}
              data-testid={`t--sidebar-${condition}-condition-icon`}
              name={ConditionConfig[condition].icon}
              size="md"
            />
          )}
        </Styled.IconContainer>
      </Tooltip>
      {title ? <Text kind="body-s">{title}</Text> : null}
    </Styled.Container>
  );
}

export default SidebarButton;
