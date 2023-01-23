import React from "react";
import clsx from "clsx";

type ActionBlockProps = {
  actionTypeLabel: string;
  action: string;
  icon: React.FunctionComponent;
  borderLess?: boolean;
  onClick: () => void;
  selected?: boolean;
  actionsCount?: number;
};

export const ActionBlock: React.FC<ActionBlockProps> = ({
  action,
  actionsCount = 0,
  actionTypeLabel,
  borderLess = false,
  icon,
  onClick,
  selected = false,
}) => {
  const ActionIcon = icon;
  return (
    <button
      className={clsx(
        "flex flex-col w-full p-2",
        !borderLess &&
          "border-[1px] hover:border-gray-200 border-transparent focus:border-gray-200 border-b-[1px] border-b-gray-200 border-solid",
        selected && "!border-gray-500 border-solid border-[1px]",
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-1">
        <ActionIcon />
        <div className="text-xs text-gray-600">{actionTypeLabel}</div>
      </div>
      <div className="flex text-sm text-gray-700 relative w-full">
        {action}
        {actionsCount > 0 ? (
          <span className="flex items-center justify-center absolute bottom-1 right-1 rounded-full text-xs min-h-5 min-w-5 max-h-5 max-w-5 bg-gray-100 text-gray-800 p-2">
            +{actionsCount}
          </span>
        ) : null}
      </div>
    </button>
  );
};
