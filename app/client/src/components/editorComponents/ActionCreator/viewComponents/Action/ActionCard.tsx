import clsx from "clsx";
import React from "react";
import { ActionCreatorContext } from "../..";
import { AppsmithFunction } from "../../constants";
import type { TActionBlock, VariantType } from "../../types";
import { getActionInfo } from "../ActionBlockTree/utils";

type TActionCardProps = {
  onSelect: () => void;
  selected: boolean;
  actionBlock: TActionBlock;
  variant?: VariantType;
  id: string;
  level: number;
};

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

  const {
    action,
    actionTypeLabel,
    Icon: MainActionIcon,
  } = getActionInfo(code, actionType);

  let className = "flex flex-col gap-1 w-full p-2 action-block-tree";

  switch (variant) {
    case "mainBlock":
      className = clsx(
        className,
        "border-[1px] border-gray-200",
        selected && "border-b-transparent",
      );
      break;
    case "callbackBlock":
      className = clsx(
        className,
        "border-[1px] border-gray-200",
        "border-t-0",
        isNextCardSelected && "border-b-gray-500",
      );
      break;

    case "hoverBorder":
      className = clsx(
        className,
        "border-[1px] border-t-transparent border-x-transparent !border-b-gray-200! hover:!border-gray-200",
      );
      break;
  }

  return (
    <button
      className={clsx(selected && "border-[1px] !border-gray-500", className)}
      data-testid={`action-card-${actionTypeLabel}`}
      onClick={props.onSelect}
    >
      <div className="flex flex-row justify-between w-full">
        <div className="flex flex-col items-center gap-1 overflow-hidden">
          <div className="flex flex-row gap-1 w-full flex-start items-center">
            <MainActionIcon />
            <div className="text-xs text-gray-600">{actionTypeLabel}</div>
          </div>
          {action && (
            <div className="w-full flex overflow-hidden text-ellipsis">
              <span className="text-sm text-gray-700 text-left overflow-hidden text-ellipsis whitespace-nowrap block">
                {action}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-end justify-center flex-shrink-0">
          {actionsCount > 0 ? (
            <span className="flex items-center justify-center rounded-full text-xs min-h-5 min-w-5 max-h-5 max-w-5 bg-gray-100 text-gray-800 p-2">
              +{actionsCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export default ActionCard;
