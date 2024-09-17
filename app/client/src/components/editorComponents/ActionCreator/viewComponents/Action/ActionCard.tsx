import React from "react";
import clsx from "classnames";
import { Text, Tag } from "@appsmith/ads";
import { ActionCreatorContext } from "../..";
import { AppsmithFunction } from "../../constants";
import type { TActionBlock, VariantType } from "../../types";
import { getActionInfo } from "../ActionBlockTree/utils";

interface TActionCardProps {
  onSelect: () => void;
  selected: boolean;
  actionBlock: TActionBlock;
  variant?: VariantType;
  isLastBlock?: boolean;
  showCallbacks?: boolean;
  id: string;
  level: number;
}

function ActionCard(props: TActionCardProps) {
  const actionBlock = props.actionBlock;
  const {
    actionType,
    code,
    error: { blocks: errorBlocks },
    success: { blocks: successBlocks },
  } = actionBlock;
  const selected = props.selected;
  const variant: string = props.variant || "mainBlock";
  const actionsCount =
    successBlocks.filter(
      ({ actionType }) => actionType !== AppsmithFunction.none,
    ).length +
    errorBlocks.filter(({ actionType }) => actionType !== AppsmithFunction.none)
      .length;
  const { selectedBlockId } = React.useContext(ActionCreatorContext);
  const nextId = props.id
    .split("_")
    .slice(0, -1)
    .concat((parseInt(props.id.split("_").pop() || "0") + 1).toString());

  const isNextCardSelected = nextId.join("_") === selectedBlockId;

  let className = "flex flex-col gap-1 w-full p-2 action-block-tree";

  const {
    action,
    actionTypeLabel,
    Icon: MainActionIcon,
  } = getActionInfo(code, actionType);

  switch (variant) {
    case "mainBlock":
      className = clsx(
        className,
        `border-[1px] main-block-radius action-card-border`,
        props.showCallbacks && "main-block-radius-selected",
        selected && "border-b-transparent",
      );
      break;
    case "callbackBlock":
      className = clsx(
        className,
        `border-[1px] action-card-border`,
        "border-t-0",
        props.isLastBlock && `action-card-last-block`,
        isNextCardSelected && `action-card-next-selected`,
      );
      break;
  }

  return (
    <button
      className={clsx(
        selected && `border-[1px] action-card-border-selected`,
        className,
      )}
      data-testid={`action-card-${actionTypeLabel}`}
      onClick={props.onSelect}
    >
      <div className="flex flex-row justify-between w-full">
        <div className="flex flex-col items-center gap-1 overflow-hidden">
          <div className="text-[color:var(--ads-v2\-color-fg)] flex flex-row gap-1 w-full flex-start items-center">
            <MainActionIcon />
            <Text kind="action-s">{actionTypeLabel}</Text>
          </div>
          {action && (
            <div className="w-full flex overflow-hidden text-ellipsis">
              <Text
                className="text-left overflow-hidden text-ellipsis whitespace-nowrap block"
                kind="action-m"
              >
                {action}
              </Text>
            </div>
          )}
        </div>
        {actionsCount > 0 ? (
          <Tag isClosable={false}>+{actionsCount}</Tag>
        ) : null}
      </div>
    </button>
  );
}

export default ActionCard;
