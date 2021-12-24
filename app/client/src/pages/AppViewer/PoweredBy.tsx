import React from "react";

import { ReactComponent as AppsmithLogo } from "assets/svg/appsmith_logo_primary.svg";

function PoweredBy() {
  return (
    <a
      className="fixed z-50 block px-1 bg-white border rounded-md hover:no-underline right-8 bg-opacity-30 bottom-4 backdrop-blur-xl backdrop-filter"
      href="/"
    >
      <h4 className="pt-1 pl-2 text-gray-500 text-xxs">Powered by</h4>
      <AppsmithLogo className="h-8 -mt-2" />
    </a>
  );
}

export default PoweredBy;
