import { createGlobalStyle } from "styled-components";

import { createGlobalFontStack } from "components/wds/utils/typography";

const { fontFaces } = createGlobalFontStack();

export const FontStackStyles = createGlobalStyle`
  ${fontFaces}
`;
