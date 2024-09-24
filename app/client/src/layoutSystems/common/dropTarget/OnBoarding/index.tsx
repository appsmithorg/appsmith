import { EMPTY_CANVAS_HINTS, createMessage } from "ee/constants/messages";
import React from "react";

function Onboarding() {
  return (
    <h2 className="absolute top-0 left-0 right-0 flex items-end h-108 justify-center text-2xl font-bold text-gray-300">
      {createMessage(EMPTY_CANVAS_HINTS.DRAG_DROP_WIDGET_HINT)}
    </h2>
  );
}

export default Onboarding;
