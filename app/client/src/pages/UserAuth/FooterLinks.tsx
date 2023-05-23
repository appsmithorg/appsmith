import React from "react";
import { Link } from "design-system";

function FooterLinks() {
  return (
    <div className="flex items-center justify-center gap-4 px-2 py-2">
      <Link target="_blank" to="/privacy-policy.html">
        Privacy policy
      </Link>
      <Link target="_blank" to="/terms-and-conditions.html">
        Terms and conditions
      </Link>
    </div>
  );
}

export default FooterLinks;
