import React from "react";
import { Icon } from "design-system";

type ActionBlockProps = {
  label: string;
};

export const ActionBlock: React.FC<ActionBlockProps> = ({ label }) => {
  return (
    <button className="flex flex-col w-full p-1 border-[1px] hover:border-gray-200 border-transparent focus:border-gray-200 border-b-[1px] border-b-gray-200 border-solid">
      <div className="flex items-center gap-1">
        <Icon name="filter" size="extraSmall" />
        <div className="text-xs text-gray-600">{label}</div>
      </div>
      <div className="text-sm text-gray-700">Trigger</div>
    </button>
  );
};
