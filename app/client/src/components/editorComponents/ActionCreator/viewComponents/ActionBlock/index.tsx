import React from "react";
import clsx from "clsx";

type ActionBlockProps = {
  actionTypeLabel: string;
  action: string;
  icon: React.FunctionComponent;
  borderLess?: boolean;
  onClick: () => void;
  selected?: boolean;
};

export const ActionBlock: React.FC<ActionBlockProps> = ({
  action,
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
      <div className="text-sm text-gray-700">{action}</div>
    </button>
  );
};
