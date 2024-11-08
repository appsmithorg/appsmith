import React from "react";

/*
This is client-controlled, stateless CSRF protection implementation.

For any form submissions, please include the `CsrfTokenInput` as a field, and CSRF protection should kick in by itself.

What does it do?
Adding this component to a form does two things.
One, sets the `XSRF-TOKEN` cookie to a new random string, if not already present.
Two, adds a hidden input field with name `_csrf`, with the value equal to `XSRF-TOKEN` cookie.

How does it protect?
The server checks, for eligible(A) requests, that the value of `XSRF-TOKEN` cookie, and the `_csrf` form field value are
equal. If they're not, it's considered a CSRF fail, and the request is aborted.
If a website is attempting CSRF at us, they'll have to either read the value of `XSRF-TOKEN` cookie, or set it to
something. Since browsers don't allow Javascript to set or get cookies of a different site, this isn't possible. This
means the CSRF form submitter can't set the right value for the `_csrf` form field.

A: Eligible requests are requests that are possible via browser form submission. That is `GET` and `POST` method, that
do NOT have a `X-Requested-By` header.
 */

export default function CsrfTokenInput() {
  return <input name="_csrf" type="hidden" value={getOrGenerateCsrfToken()} />;
}

function getOrGenerateCsrfToken(): string {
  let token: string | undefined = document.cookie.match(
    /\bXSRF-TOKEN=([-a-z0-9]+)/i,
  )?.[1];

  /*
  Problem: On logout, server clears the `XSRF-TOKEN` cookie, so that when the login page is "loaded", a new token cookie
  can be sent. But Appsmith is an SPA, and the login page isn't exactly "loaded" after logging out. It's just shown. No
  new HTTP request is made, and so the server doesn't have a chance to set a new `XSRF-TOKEN`.

  So, we do it ourselves in such case. After all, what we need is that the same random string be present in the
  `XSRF-TOKEN` cookie, and the `_csrf` form parameter. No standard browser allows that to happen in cross-site form
  submissions, so we're safe from CSRF.
   */
  if (!token) {
    token =
      Math.random().toString(36).substring(2) +
      Math.random().toString(36).substring(2);
    document.cookie = "XSRF-TOKEN=" + token;
  }

  return token;
}
