import React from "react";
import { tw } from "twind";
import * as Sentry from "@sentry/react";
import { ButtonBorderRadius } from "components/constants";
import { getBorderRadiusValue } from "widgets/WidgetUtils";
import Button, { Category } from "components/ads/Button";

interface ThemeCard {
  borderRadius?: string;
  primaryColor?: string;
  backgroundColor?: string;
  className?: string;
}

export function ThemeCard(props: ThemeCard) {
  return (
    <div className={`border ${props.className} relative group overflow-hidden`}>
      <main className="group-hover:blur-md filter">
        <hgroup className={`${tw`bg-[${props.primaryColor}]`} flex p-3`}>
          <h3 className="flex-grow">Rounded</h3>
          <aside>@appsmith</aside>
        </hgroup>
        <section className="flex justify-between px-3 pt-3">
          <div>AaBbCc</div>
          <div className="flex items-center space-x-2">
            <div
              className={`${tw`bg-[${props.primaryColor}]`}  rounded-full h-6 w-6`}
            />
            <div
              className={`${tw`bg-[${props.backgroundColor}]`}  rounded-full h-6 w-6`}
            />
            <div className={`bg-white rounded-full h-6 w-6 border`} />
          </div>
        </section>
        <section className="p-3">
          <div className="flex space-x-2">
            <div
              className={`${tw`rounded-${props.borderRadius} bg-[${props.primaryColor}]`} px-3 py-1`}
            >
              Button
            </div>
            <div
              className={`${tw`rounded-${props.borderRadius} border-[${props.primaryColor}]`} px-3 py-1 border`}
            >
              Button
            </div>
          </div>
        </section>
      </main>
      <aside className="absolute top-0 bottom-0 left-0 right-0 items-center justify-center hidden bg-black bg-opacity-25 group-hover:flex">
        <div className="space-y-2">
          <Button text="Change Theme" />
        </div>
      </aside>
    </div>
  );
}

ThemeCard.displayName = "ThemeCard";

export default Sentry.withProfiler(ThemeCard);
