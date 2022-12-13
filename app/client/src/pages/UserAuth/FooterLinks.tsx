import React from "react";

function FooterLinks() {
  return (
    <div className="flex items-center justify-center gap-4 px-2 py-2">
      <a
        className="text-gray-900 hover:text-inherit"
        href="/privacy-policy.html"
        target="_blank"
      >
        Privacy Policy
      </a>
      <a
        className="text-gray-900 hover:text-inherit"
        href="/terms-and-conditions.html"
        target="_blank"
      >
        Terms and conditions
      </a>
    </div>
  );
}

export default FooterLinks;
