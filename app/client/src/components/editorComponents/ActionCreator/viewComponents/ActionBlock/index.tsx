import React from "react";
import clsx from "clsx";

type ActionBlockProps = {
  actionTypeLabel: string;
  action: string;
  icon: React.FunctionComponent;
  onClick: () => void;
  selected?: boolean;
  actionsCount?: number;
  variant?: "borderLess" | "callbackBlock" | "hoverBorder";
};

export const ActionBlock: React.FC<ActionBlockProps> = ({
  action,
  actionsCount = 0,
  actionTypeLabel,
  icon,
  onClick,
  selected = false,
  variant = "hoverBorder",
}) => {
  const ActionIcon = icon;

  let className = "flex flex-col gap-1 w-full p-2";

  switch (variant) {
    case "borderLess":
      className = clsx(className, "border-[1px] border-transparent");
      break;

    case "callbackBlock":
      className = clsx(
        className,
        "border-x-[1px] border-b-[1px] border-gray-200",
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
      onClick={onClick}
    >
      <div className="flex items-center gap-1">
        <ActionIcon />
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
};
