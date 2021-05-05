import React from "react";
import { ChildrenNode, Matcher, MatchResponse, Node } from "interweave";
import { EmailProps, Email } from "interweave-autolink";

type EmailMatch = Pick<EmailProps, "email" | "emailParts">;

interface CombinePatternsOptions {
  capture?: boolean;
  flags?: string;
  join?: string;
  match?: string;
  nonCapture?: boolean;
}

function combinePatterns(
  patterns: RegExp[],
  options: CombinePatternsOptions = {},
) {
  let regex = patterns
    .map((pattern) => pattern.source)
    .join(options.join || "");

  if (options.capture) {
    regex = `(${regex})`;
  } else if (options.nonCapture) {
    regex = `(?:${regex})`;
  }

  if (options.match) {
    regex += options.match;
  }

  return new RegExp(regex, options.flags || "");
}

const URL_HOST = combinePatterns(
  [
    /(?:(?:[a-z0-9](?:[-a-z0-9_]*[a-z0-9])?)\.)*/, // Subdomain
    /(?:(?:[a-z0-9](?:[-a-z0-9]*[a-z0-9])?)\.)/, // Domain
    /(?:[a-z](?:[-a-z0-9]*[a-z0-9])?)/, // TLD
  ],
  {
    capture: true,
  },
);

const EMAIL_USERNAME_PART = /[.a-z0-9!#$%&?*+=_{|}~-]+/;

const VALID_ALNUM_CHARS = /[a-z0-9]/;

const EMAIL_USERNAME = combinePatterns(
  [VALID_ALNUM_CHARS, EMAIL_USERNAME_PART, VALID_ALNUM_CHARS],
  {
    capture: true,
  },
);

export const EMAIL_PATTERN = combinePatterns([EMAIL_USERNAME, URL_HOST], {
  flags: "i",
  join: "@",
});

export default class EmailMatcher extends Matcher<EmailProps> {
  replaceWith(children: ChildrenNode, props: EmailProps): Node {
    return React.createElement(Email, props, children);
  }

  asTag(): string {
    return "a";
  }

  match(string: string): MatchResponse<EmailMatch> | null {
    return this.doMatch(string, EMAIL_PATTERN, (matches) => ({
      email: matches[0],
      emailParts: {
        host: matches[2],
        username: matches[1],
      },
    }));
  }
}
