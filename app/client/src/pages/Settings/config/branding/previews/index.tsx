import React, { useEffect, useState } from "react";

import AppPreview from "./AppPreview";
import EmailPreview from "./EmailPreview";
import LoginPreview from "./LoginPreview";
import FaviconPreview from "./FaviconPreview";
import NotFoundPreview from "./NotFoundPreview";
import DashboardPreview from "./DashboardPreview";
import { brandColorsKeys } from "../BrandingPage";

export type PreviewsProps = {
  shades: Record<brandColorsKeys, string>;
  logo: string | Blob;
  favicon: string;
};

const Previews = (props: PreviewsProps) => {
  const { favicon, logo } = props;

  const [logoPreview, setLogoPreview] = useState<any>(null);
  const [faviconPreview, setFaviconPreview] = useState<any>(null);

  useEffect(() => {
    if (!logo) return;

    if (typeof logo === "string") {
      setLogoPreview(logo);

      return;
    }

    if (typeof logo !== "string") {
      const reader = new FileReader();
      reader.readAsDataURL(logo);

      reader.onloadend = function() {
        setLogoPreview(reader.result);
      };
    }
  }, [logo]);

  useEffect(() => {
    if (!favicon) return;

    if (typeof favicon === "string") {
      setFaviconPreview(favicon);

      return;
    }

    if (typeof favicon !== "string") {
      const reader = new FileReader();
      reader.readAsDataURL(favicon);

      reader.onloadend = function() {
        setFaviconPreview(reader.result);
      };
    }
  }, [favicon]);

  return (
    <div className="grid grid-cols-[repeat(auto-fit,_minmax(330px,_1fr))] gap-4 auto-rows-[200px] pb-8 pointer-events-none select-none">
      {/* login */}
      <LoginPreview {...props} logo={logoPreview} />
      <EmailPreview {...props} logo={logoPreview} />
      <DashboardPreview {...props} logo={logoPreview} />
      <AppPreview {...props} logo={logoPreview} />
      <NotFoundPreview {...props} logo={logoPreview} />
      <FaviconPreview {...props} favicon={faviconPreview} logo={logoPreview} />
    </div>
  );
};

export default Previews;
