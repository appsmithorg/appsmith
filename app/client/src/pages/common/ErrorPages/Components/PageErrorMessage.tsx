import classNames from "classnames";
import React from "react";

export interface PageErrorMessageProps {
  text: string;
  links?: Array<{
    from: number;
    to: number;
    href: string;
  }>;
  addNewLine?: boolean;
}

export function PageErrorMessage(props: { data: PageErrorMessageProps }) {
  const errorMessage = props.data;
  const text = errorMessage.text;
  const lineContent: JSX.Element[] = [];

  if (errorMessage.links && errorMessage.links.length > 0) {
    errorMessage.links.reduce((prev, curr, idx, links) => {
      // add text from 0 -> link position
      if (idx === 0 && curr.from > 0) {
        prev.push(<span>{text.slice(0, curr.from)}</span>);
      }
      // add inbetween text from prev link end to current link start
      else {
        const prevLink = links[idx - 1];

        if (prevLink && curr.from - prevLink.to > 0) {
          prev.push(<span>{text.slice(prevLink.to, curr.from)}</span>);
        }
      }

      // add link element
      prev.push(
        <a
          className="underline"
          href={curr.href}
          rel="noreferrer"
          target="_blank"
        >
          {text.slice(curr.from, curr.to)}
        </a>,
      );

      // add text from link end -> end of string
      if (idx === links.length - 1 && curr.to < text.length - 1) {
        prev.push(<span>{text.slice(curr.to, text.length)}</span>);
      }

      return prev;
    }, lineContent);
  } else {
    lineContent.push(<span>{text}</span>);
  }

  return (
    <div
      className={classNames({
        // overrides default margin set in Parent component (Page.tsx)
        // makes it smaller when we don't want to add new line
        "!mt-1": !errorMessage.addNewLine,
      })}
    >
      {[...lineContent]}
    </div>
  );
}
