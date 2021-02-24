import React from "react";

const Highlight = ({ match, text }: { match: string; text: string }) => {
  if (!match) return <span>{text}</span>;

  const regEx = new RegExp(match, "ig");
  const parts = text?.split(regEx);
  if (parts?.length === 1) return <span>{text}</span>;
  let lastIndex = 0;

  return (
    <span>
      {parts?.map((part, index) => {
        lastIndex += Math.max(part.length, 0);
        const result = (
          <React.Fragment key={index}>
            {part}
            {index !== parts.length - 1 && (
              <span className="search-highlighted">
                {text.slice(lastIndex, lastIndex + match.length)}
              </span>
            )}
          </React.Fragment>
        );
        lastIndex += match.length;
        return result;
      })}
    </span>
  );
};

export default Highlight;
