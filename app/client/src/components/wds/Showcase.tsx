import React, { useState } from "react";

import { Checkbox, Button } from "components/wds";
import {
  borderRadiusOptions,
  boxShadowOptions,
} from "constants/ThemeConstants";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
} from "components/wds";

import "components/wds/styles.css";

import CloseLineIcon from "remixicon-react/CloseLineIcon";

function Showcase() {
  const [borderRadius, setBorderRadius] = useState<string | number>("0px");
  const [boxShadow, setBoxShadow] = useState<string | number>("none");
  const [primaryColor, setPrimaryColor] = useState("#553DE9");

  const cssVariables: any = {
    "--wds-radii": borderRadius || "0px",
    "--wds-shadow": boxShadow || "none",
  };

  return (
    <div className="container min-h-screen pt-12 mx-auto" style={cssVariables}>
      <h1 className="mt-12 space-y-8 text-3xl font-bold">
        Widgets Design System
      </h1>

      <h1>Theme Options</h1>
      <div className="flex items-center gap-4">
        <input
          onChange={(e) => setPrimaryColor(e.target.value)}
          type="color"
          value={primaryColor}
        />
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
                className="w-4 h-4 border-t-2 border-l-2 border-gray-600"
                style={{ borderTopLeftRadius: borderRadiusOptions[optionKey] }}
              />
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {Object.keys(boxShadowOptions).map((optionKey) => (
            <button
              className={`flex items-center justify-center w-8 h-8 bg-trueGray-100 ring-gray-700 cursor-pointer hover:bg-trueGray-50 ${
                boxShadow === boxShadowOptions[optionKey] ? "ring-1" : ""
              }`}
              key={optionKey}
              onClick={() => {
                setBoxShadow(boxShadowOptions[optionKey]);
              }}
            >
              <div
                className="flex items-center justify-center w-5 h-5 bg-white"
                style={{ boxShadow: boxShadowOptions[optionKey] }}
              >
                {boxShadowOptions[optionKey] === "none" && (
                  <CloseLineIcon className="text-gray-700" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-4">
        <Button buttonColor={primaryColor} className="w-32">
          Default
        </Button>

        <Button buttonColor={primaryColor} className="w-32" variant="outline">
          Outline
        </Button>

        <Button buttonColor={primaryColor} className="w-32" variant="ghost">
          Ghost
        </Button>

        <Button buttonColor={primaryColor} className="w-32" variant="link">
          Link
        </Button>

        <Button buttonColor={primaryColor} className="w-32" isDisabled>
          Default Disabled
        </Button>

        <Button
          buttonColor={primaryColor}
          className="w-32"
          isDisabled
          variant="outline"
        >
          Outline Disabled
        </Button>

        <Button
          buttonColor={primaryColor}
          className="w-32"
          isDisabled
          variant="ghost"
        >
          Ghost Disabled
        </Button>

        <Button
          buttonColor={primaryColor}
          className="w-32"
          isDisabled
          variant="link"
        >
          Link Disabled
        </Button>

        <Button buttonColor="crimson" className="w-32" variant="solid">
          Danger Solid
        </Button>

        <Button buttonColor="crimson" className="w-32" variant="outline">
          Danger Outline
        </Button>

        <Button buttonColor="crimson" className="w-32" variant="ghost">
          Danger Ghost
        </Button>

        <Button buttonColor="crimson" className="w-32" variant="link">
          Danger Link
        </Button>

        <Button buttonColor="green" className="w-32" variant="solid">
          Success Solid
        </Button>

        <Button buttonColor="green" className="w-32" variant="outline">
          Success Outline
        </Button>

        <Button buttonColor="green" className="w-32" variant="ghost">
          Success Ghost
        </Button>

        <Button buttonColor="green" className="w-32" variant="link">
          Success Link
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <button>Pawan</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <input placeholder="filter" tabIndex={-1} />
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
            <DropdownMenuItem>Item 3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default Showcase;
