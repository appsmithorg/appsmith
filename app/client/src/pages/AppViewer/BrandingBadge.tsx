import React from "react";

import { ReactComponent as AppsmithLogo } from "assets/svg/appsmith-logo-no-pad.svg";

function BrandingBadge() {
  return (
    <span className="flex items-center p-1 px-2 space-x-2 bg-white border rounded-md w-max backdrop-blur-xl backdrop-filter">
      <h4 className="text-xs text-gray-500">Built on</h4>
      <AppsmithLogo className="w-auto h-3" />
    </span>
  );
}

export default BrandingBadge;
