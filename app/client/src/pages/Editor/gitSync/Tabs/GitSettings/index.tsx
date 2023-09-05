import React from "react";
import GitUserSettings from "./GitUserSettings";
import GitDisconnect from "./GitDisconnect";

function GitSettings() {
  return (
    <div>
      <GitUserSettings />
      <GitDisconnect />
    </div>
  );
}

export default GitSettings;
