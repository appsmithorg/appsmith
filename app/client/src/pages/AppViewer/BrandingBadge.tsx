import React from "react";

import { ReactComponent as AppsmithLogo } from "assets/svg/appsmith-logo-no-pad.svg";

function BrandingBadge() {
  return (
    <a
      className="fixed items-center hidden p-1 px-2 space-x-2 bg-white border rounded-md md:flex z-2 hover:no-underline right-8 bottom-4 backdrop-blur-xl backdrop-filter"
      href="/"
    >
      <h4 className="text-xs text-gray-500">Built on</h4>
      <AppsmithLogo className="w-auto h-3" />
    </a>
  );
}

export default BrandingBadge;
