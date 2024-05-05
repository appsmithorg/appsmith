import React from "react";

export default function CsrfTokenInput() {
  const csrfToken: string =
    document.cookie.match(/\bXSRF-TOKEN=([-a-z0-9]+)/i)?.[1] ?? "";

  return <input name="_csrf" type="hidden" value={csrfToken} />;
}
