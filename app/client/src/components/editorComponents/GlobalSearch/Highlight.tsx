import React from "react";

const Highlight = ({ match, text }: { match: string; text: string }) => {
  const regEx = new RegExp(match, "ig");
  const parts = text?.split(regEx);
  if (parts?.length === 1) return <span>{text}</span>;

  return (
    <span>
      {parts?.map((part, index) => (
        <React.Fragment key={index}>
          {part}
          {index !== parts.length - 1 && (
            <span className="search-highlighted">{match}</span>
          )}
        </React.Fragment>
      ))}
    </span>
  );
};

export default Highlight;
