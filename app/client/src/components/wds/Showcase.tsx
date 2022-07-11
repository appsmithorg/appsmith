import React, { useState } from "react";

import { Checkbox, Button } from "components/wds";
import Overlay from "components/wds/Overlay";
import Dialog from "components/wds/Dialog";
import {
  borderRadiusOptions,
  boxShadowOptions,
} from "constants/ThemeConstants";

import "components/wds/styles.css";

import CloseLineIcon from "remixicon-react/CloseLineIcon";

function Showcase() {
  const [borderRadius, setBorderRadius] = useState<string | number>("0px");
  const [boxShadow, setBoxShadow] = useState<string | number>("none");
  const [primaryColor, setPrimaryColor] = useState("#553DE9");
  const [isOpen, setIsOpen] = React.useState(false);
  const noButtonRef = React.useRef(null);
  const anchorRef = React.useRef(null);
  const returnFocusRef = React.useRef(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const cssVariables: any = {
    "--wds-radii": borderRadius || "0px",
    "--wds-shadow": boxShadow || "none",
  };

  return (
    <div
      className="container min-h-screen pt-12 mx-auto space-y-3"
      style={cssVariables}
    >
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

        <div className="flex gap-2 mt-3">
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

        <Button
          buttonColor="green"
          className="w-32"
          onClick={() => setIsOpen(!isOpen)}
          ref={anchorRef}
          variant="ghost"
        >
          open overlay
        </Button>
        {/* be sure to conditionally render the Overlay. This helps with performance and is required. */}
        {isOpen && (
          <Overlay
            aria-labelledby="title"
            height={200}
            ignoreClickRefs={[anchorRef]}
            initialFocusRef={noButtonRef}
            onClickOutside={() => setIsOpen(false)}
            onEscape={() => setIsOpen(!isOpen)}
            returnFocusRef={anchorRef}
            top={50}
          >
            <p>Hello world how are you</p>
          </Overlay>
        )}

        <Dialog aria-labelledby="header-id">
          <Dialog.Button
            className="w-32"
            onClick={() => setIsDialogOpen(true)}
            variant="ghost"
          >
            Open Dialog
          </Dialog.Button>
          <Dialog.Content>
            <input placeholder="helo" type="text" />
            <input placeholder="helo2" type="text" />
            <p>Dialog</p>
          </Dialog.Content>
        </Dialog>

        {/* <Dialog>
          <Dialog.Button className="w-32" variant="ghost">
            Open Dialog
          </Dialog.Button>
          <Dialog.Content aria-labelledby="header-id">
            <input placeholder="helo" type="text" />
            <input placeholder="helo2" type="text" />
            <p>Dialog</p>
          </Dialog.Content>
        </Dialog> */}

        <Button as="a" buttonColor={primaryColor} variant="solid">
          Anchor Tag
        </Button>
      </div>
    </div>
  );
}

export default Showcase;
