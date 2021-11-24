import React from "react";

import Dropdown from "components/ads/Dropdown";
import { ButtonBorderRadiusTypes } from "components/constants";

function ThemeBorderRadiusControl() {
  return (
    <Dropdown
      className="px-0"
      options={[
        {
          label: "Default",
          value: "rounded-tl-none",
        },
        {
          label: "md",
          value: "rounded-tl-md",
        },
        {
          label: "lg",
          value: "rounded-tl-lg",
        },
      ]}
      renderOption={({ isSelectedNode, option }) => (
        <div
          className={`flex py-2 space-x-2 w-full ${
            isSelectedNode ? "" : "px-2 hover:bg-gray-100 cursor-pointer"
          }`}
        >
          <div className="flex items-center justify-center w-6 h-6 bg-trueGray-100">
            <div
              className={`w-3 h-3 border-t-2 border-l-2 rounded- border-gray-600 ${option.value}`}
            />
          </div>
          <div>{option.label}</div>
        </div>
      )}
      selected={{
        label: "Default",
        value: ButtonBorderRadiusTypes.SHARP,
      }}
      showLabelOnly
      width="100%"
    />
  );
}

export default ThemeBorderRadiusControl;
