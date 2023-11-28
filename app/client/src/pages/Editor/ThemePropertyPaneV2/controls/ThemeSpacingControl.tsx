import React from "react";
import { Select, Option } from "design-system";
import type { AppTheme } from "entities/AppTheming";
import styled from "styled-components";

interface ThemeFontControlProps {
  theme: AppTheme;
  updateTheme: (theme: AppTheme) => void;
}

const FontText = styled.div`
  border-radius: var(--ads-v2-border-radius);
  border: 1px solid var(--ads-v2-color-border);
  font-size: 11px;
  height: 18px;
  width: 18px;
`;

function ThemeSpacingControl(props: ThemeFontControlProps) {
  const { options, sectionName, selectedOption, theme, updateTheme } = props;

  return (
    <section className="space-y-2">
      <input id="volume" max="11" min="0" name="volume" type="range" />
    </section>
  );
}

export default ThemeSpacingControl;
