import React from "react";

import { ReactComponent as AppsmithLogo } from "assets/svg/appsmith-logo-no-pad.svg";

function BrandingBadge() {
  return (
    <a
      className="flex items-center p-1 px-2 space-x-2 bg-white rounded-md md:border md:flex z-2 hover:no-underline"
      href="https://appsmith.com"
      rel="noreferrer"
      target="_blank"
    >
      <h4 className="text-xs text-gray-500">Built on</h4>
      <AppsmithLogo className="w-auto h-3" />
    </a>
  );
}

export default BrandingBadge;
