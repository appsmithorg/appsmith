import React from "react";
import * as Sentry from "@sentry/react";

import { MainContainerLayoutControl } from "../MainContainerLayoutControl";
import ThemeEditor from "../ThemePropertyPane/ThemeEditor";
import styled from "styled-components";
import { Colors } from "constants/Colors";

const Title = styled.p`
  color: ${Colors.GRAY_800};
`;

type Props = {
  skipThemeEditor?: boolean;
};

export function CanvasPropertyPane(props: Props) {
  return (
    <div className="relative ">
      <h3 className="px-4 py-3 text-sm font-medium uppercase">Properties</h3>

      <div className="mt-3 space-y-6">
        <div className="px-4 space-y-2">
          <Title className="text-sm">Canvas Size</Title>
          <MainContainerLayoutControl />
        </div>

        {!props.skipThemeEditor && <ThemeEditor />}
      </div>
    </div>
  );
}

CanvasPropertyPane.displayName = "CanvasPropertyPane";

export default Sentry.withProfiler(CanvasPropertyPane);
