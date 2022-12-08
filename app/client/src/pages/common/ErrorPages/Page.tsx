import React from "react";

type PageProps = {
  children?: React.ReactNode;
  errorCode?: string | number;
  title?: string;
  description: string;
  cta?: React.ReactNode;
  flushErrorsAndRedirect?: any;
};

function Page(props: PageProps) {
  const { cta, description, errorCode, title } = props;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 bg-[color:var(--ads-color-background-secondary)]">
      {errorCode && (
        <div className="-mt-8 flex items-center font-bold text-3xl justify-center w-28 bg-white border aspect-square text-[color:var(--ads-color-brand)]">
          {errorCode}
        </div>
      )}
      {title && (
        <p className="text-3xl font-semibold t--error-page-title">{title}</p>
      )}
      {description && <p className="text-center">{description}</p>}
      {cta}
    </div>
  );
}

export default Page;
