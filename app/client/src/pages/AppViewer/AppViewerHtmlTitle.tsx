import React from "react";
import { Helmet } from "react-helmet";

interface Props {
  name?: string;
}

function AppViewerHtmlTitle(props: Props) {
  const { name } = props;

  // if no name is passed, just return null
  if (!name) return null;

  return (
    <Helmet>
      <title>{name}</title>
    </Helmet>
  );
}

export default AppViewerHtmlTitle;
