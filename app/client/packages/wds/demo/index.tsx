import React, { CSSProperties, useState } from "react";
import styled from "styled-components";

export const boxShadowOptions: Record<string, string> = {
  none: "none",
  S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
};

export const borderRadiusOptions: Record<string, string> = {
  none: "0px",
  M: "0.375rem",
  L: "1.5rem",
};

import CloseLineIcon from "remixicon-react/CloseLineIcon";
import ButtonShowcase from "./Button";
import ButtonGroupShowcase from "./ButtonGroup";
import { createTokens } from "../utils/createTokens";
import TextShowcase from "./Text";

type StyledWrapperProps = {
  borderRadius: CSSProperties["borderRadius"];
  boxShadow: CSSProperties["boxShadow"];
  accentColor: CSSProperties["color"];
};

const StyledWrapper = styled.div<StyledWrapperProps>`
  ${createTokens}
`;

function Showcase() {
  const [borderRadius, setBorderRadius] = useState<string>("0.375rem");
  const [boxShadow, setBoxShadow] = useState<string>("none");
  const [primaryColor, setPrimaryColor] = useState<string>("#553DE9");
  const [loading, setLoading] = useState<boolean>(true);

  return (
    <StyledWrapper
      accentColor={primaryColor}
      borderRadius={borderRadius}
      boxShadow={boxShadow}
      className="container min-h-screen pt-12 mx-auto"
    >
      <h1 className="mt-12 space-y-8 text-3xl font-bold">
        Widgets Design System
      </h1>

      <h1 className="mt-2">Theme Options</h1>
      <div className="flex items-center gap-4 mt-2">
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
      <div className="space-y-5">
        <ButtonShowcase loading={loading} />
        <ButtonGroupShowcase loading={loading} />
        <TextShowcase loading={loading} />
      </div>
    </StyledWrapper>
  );
}

export default Showcase;
