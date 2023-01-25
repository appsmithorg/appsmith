import React from "react";
import { Helmet } from "react-helmet";

interface Props {
  name?: string;
  description?: string;
}

function AppViewerHtmlTitle(props: Props) {
  const { description, name } = props;

  // if no name is passed, just return null
  if (!name) return null;

  return (
    <Helmet>
      <title>{name}</title>
      {description && <meta content={description} name="description" />}
    </Helmet>
  );
}

export default AppViewerHtmlTitle;
