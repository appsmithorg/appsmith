import clsx from "clsx";
import React from "react";
import { AppsmithFunction } from "../../constants";
import { TActionBlock } from "../../types";
import { getActionInfo } from "../ActionBlockTree/utils";

type TActionCardProps = {
  onSelect: () => void;
  selected: boolean;
  actionBlock: TActionBlock;
  variant?: string;
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

  const { action, actionTypeLabel, Icon: MainActionIcon } = getActionInfo(
    code,
    actionType,
  );

  let className = "flex flex-col gap-1 w-full p-2";

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
        "border-[1px] border-t-transparent border-gray-200",
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
      onClick={props.onSelect}
    >
      <div className="flex items-center gap-1">
        <MainActionIcon />
        <div className="text-xs text-gray-600">{actionTypeLabel}</div>
      </div>
      <div className="flex text-sm text-gray-700 relative w-full ">
        <span className="w-full text-left overflow-hidden text-ellipsis whitespace-nowrap block">
          {action}
        </span>
        {actionsCount > 0 ? (
          <span className="flex items-center justify-center absolute bottom-1 right-1 rounded-full text-xs min-h-5 min-w-5 max-h-5 max-w-5 bg-gray-100 text-gray-800 p-2">
            +{actionsCount}
          </span>
        ) : null}
      </div>
    </button>
  );
}

export default ActionCard;
