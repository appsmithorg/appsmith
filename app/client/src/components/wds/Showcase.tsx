import React, { useState } from "react";

import { Checkbox, Button } from "components/wds";
import { borderRadiusOptions } from "constants/ThemeConstants";

function Showcase() {
  const [borderRadius, setBorderRadius] = useState("0px");

  const theme = {
    borderRadius,
  };

  return (
    <div className="container min-h-screen pt-12 mx-auto">
      <h1 className="mt-12 space-y-8 text-3xl font-bold">
        Widgets Design System
      </h1>

      <h1>Theme Options</h1>
      <div>Border radius</div>
      <div className="flex gap-2">
        {Object.keys(borderRadiusOptions).map((optionKey) => (
          <button
            className={`flex items-center justify-center w-8 h-8 bg-trueGray-100 ring-gray-700 cursor-pointer hover:bg-trueGray-50 ${
              borderRadius === borderRadiusOptions[optionKey] ? "ring-1" : ""
            }`}
            key={optionKey}
            onClick={() => {
              setBorderRadius(borderRadiusOptions[optionKey]);
            }}
          >
            <div
              className="w-4 h-4 border-t-2 border-l-2 border-gray-600 rounded-"
              style={{ borderTopLeftRadius: borderRadiusOptions[optionKey] }}
            />
          </button>
        ))}
      </div>

      <div className="space-y-5">
        <div className="mt-5">
          <h2 className="my-2 text-xl font-semibold">Checkbox</h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-gray-500">States</h3>
              <div className="flex space-x-3">
                <Checkbox checked label="Active" {...theme} />
                <Checkbox
                  checked={false}
                  disabled
                  label="Disabled"
                  {...theme}
                />
                <Checkbox checked={false} hasError label="Error" {...theme} />
                <Checkbox
                  checked={false}
                  indeterminate
                  label="Indeterminate"
                  {...theme}
                />
              </div>
            </div>
          </div>
        </div>
        {/* checkbox end */}

        {/* buttons */}
        <div className="">
          <h2 className="my-2 text-xl font-semibold">Buttons</h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-gray-500">Types</h3>
              <div className="flex space-x-3">
                <Button leftIcon="download" {...theme} />
                <Button variant="solid" {...theme}>
                  Solid
                </Button>
                <Button variant="outline" {...theme}>
                  Outline
                </Button>
                <Button variant="ghost" {...theme}>
                  Ghost
                </Button>
                <Button variant="link" {...theme}>
                  Link
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-gray-500">States</h3>
              <div className="flex space-x-3">
                <Button {...theme}>Default</Button>
                <Button isDisabled {...theme}>
                  Disalbed
                </Button>
                <Button isLoading {...theme}>
                  Loading
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-gray-500">Icon and Alignment</h3>
              <div className="flex space-x-3">
                <Button className="w-40" leftIcon="download" {...theme}>
                  With Icon
                </Button>
                <Button
                  className="w-40"
                  justifyContent="space-between"
                  leftIcon="download"
                  {...theme}
                >
                  With Icon
                </Button>
                <Button
                  className="w-40"
                  justifyContent="flex-start"
                  leftIcon="download"
                  {...theme}
                >
                  With Icon
                </Button>
                <Button
                  className="w-40"
                  justifyContent="flex-end"
                  leftIcon="download"
                  {...theme}
                >
                  With Icon
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-gray-500">Misc</h3>
              <div className="flex space-x-3">
                <Button tooltip="This is tooltip content" {...theme}>
                  Tooltip
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/*button end */}
      </div>
    </div>
  );
}

export default Showcase;
