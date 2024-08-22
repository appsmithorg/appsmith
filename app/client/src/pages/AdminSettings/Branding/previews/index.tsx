import React, { useEffect, useState } from "react";

import { ContentBox } from "pages/AdminSettings/components";

import type { brandColorsKeys } from "../BrandingPage";
import AppPreview from "./AppPreview";
import DashboardPreview from "./DashboardPreview";
import EmailPreview from "./EmailPreview";
import FaviconPreview from "./FaviconPreview";
import LoginPreview from "./LoginPreview";
import NotFoundPreview from "./NotFoundPreview";

export interface PreviewsProps {
  shades: Record<brandColorsKeys, string>;
  logo: string | Blob;
  favicon: string;
}

const Previews = (props: PreviewsProps) => {
  const { favicon, logo } = props;

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logoPreview, setLogoPreview] = useState<any>(null);
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      reader.onloadend = function () {
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

      reader.onloadend = function () {
        setFaviconPreview(reader.result);
      };
    }
  }, [favicon]);

  return (
    <ContentBox className="grid grid-cols-[repeat(auto-fit,_minmax(300px,_1fr))] gap-8 auto-rows-[240px] border p-8 mb-4 pointer-events-none select-none">
      {/* login */}
      <LoginPreview {...props} logo={logoPreview} />
      <EmailPreview {...props} logo={logoPreview} />
      <DashboardPreview {...props} logo={logoPreview} />
      <AppPreview {...props} logo={logoPreview} />
      <NotFoundPreview {...props} logo={logoPreview} />
      <FaviconPreview {...props} favicon={faviconPreview} logo={logoPreview} />
    </ContentBox>
  );
};

export default Previews;
