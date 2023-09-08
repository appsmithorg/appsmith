import React from "react";
import type { KBPreviewProps } from "./types";
import {
  Text,
  Collapsible,
  CollapsibleHeader,
  CollapsibleContent,
} from "design-system";
import { getPagesArray } from "./utils";
import FeedbackCallout from "./FeedbackCallout";

const KBPreview = ({
  appKb,
  isKBGenerationPending,
  onPageSelect,
  selectedPage,
  showSuccessCallout,
}: KBPreviewProps) => {
  const pages = getPagesArray(appKb.publishedKB);

  const getOnPageOpen = (pageSlug: string) => (isOpen: boolean) => {
    if (isOpen) {
      onPageSelect(pageSlug);
      return;
    }

    onPageSelect("");
  };

  return (
    <div>
      {isKBGenerationPending && (
        <div className="mb-2 mt-4">
          <Text kind="body-m">Current Published Knowledge base</Text>
        </div>
      )}

      {pages.map(({ features, intro, pageName, pageSlug }) => (
        <Collapsible
          isOpen={selectedPage === pageSlug}
          key={pageSlug}
          onOpenChange={getOnPageOpen(pageSlug)}
        >
          <CollapsibleHeader arrowPosition="start">
            <Text kind="heading-s">{pageName}</Text>
          </CollapsibleHeader>
          <CollapsibleContent>
            <FeedbackCallout
              appKb={appKb}
              isKBGenerationPending
              pageSlug={pageSlug}
              selectedPage={selectedPage}
              showSuccessCallout={showSuccessCallout}
            />

            <div className="mb-1">
              <Text kind="body-m">{intro}</Text>
            </div>
            {features.map(({ description, name, steps }, index) => (
              <div className="mt-3" key={name}>
                <div className="mb-1">
                  <Text>
                    {index + 1}. {name}
                  </Text>
                </div>
                <div>
                  <Text kind="body-m">{description}</Text>
                </div>
                <ul className="list-disc mt-1">
                  {steps.map((step) => (
                    <li className="ml-4" key={step}>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};

export default KBPreview;
