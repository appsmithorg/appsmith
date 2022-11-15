import React from "react";

function SearchComponent(props: SearchComponentProps) {
  // eslint-disable-next-line no-console
  console.log(props);
  return <div>Delete Me!</div>;
}

export interface SearchComponentProps {
  name?: string;
}

export default SearchComponent;
