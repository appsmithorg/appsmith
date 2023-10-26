import React, { useState } from "react";
import { CopyButton } from "./CopyToClipBoard";

function SelectableInput() {
  const [selectedText, setSelectedText] = useState("");

  const handleTextSelect = (event) => {
    // Get selected text from the input
    const selectedValue = event.target.value.substring(
      event.target.selectionStart,
      event.target.selectionEnd
    );
    setSelectedText(selectedValue);
  };

  return (
    <div>
      <input
        type="text"
        defaultValue="Select some text from here."
        onSelect={handleTextSelect}
      />
      <CopyButton value={selectedText} tooltipMessage="Click to copy selected text" />
    </div>
  );
}

export default SelectableInput;
