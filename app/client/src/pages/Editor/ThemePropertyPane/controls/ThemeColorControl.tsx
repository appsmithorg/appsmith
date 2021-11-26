import React from "react";
import ColorPickerComponent from "components/ads/ColorPickerComponent";

function ThemeColorControl() {
  return (
    <ColorPickerComponent
      changeColor={() => {
        //
      }}
      color="#8B5CF6"
    />
  );
}

export default ThemeColorControl;
