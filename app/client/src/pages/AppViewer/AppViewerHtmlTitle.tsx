import React from "react";
import { Helmet } from "react-helmet";
import { getAppsmithConfigs } from "ee/configs";

interface Props {
  name?: string;
  description?: string;
  lang?: string;
}

function AppViewerHtmlTitle(props: Props) {
  const { description, lang, name } = props;
  const { defaultHtmlLang } = getAppsmithConfigs();

  if (!name) return null;

  return (
    <Helmet htmlAttributes={{ lang: lang || defaultHtmlLang || "en" }}>
      <title>{name}</title>
      {description && <meta content={description} name="description" />}
    </Helmet>
  );
}

export default AppViewerHtmlTitle;
