import { createGlobalStyle } from "styled-components";
import { Layers } from "constants/Layers";

export const PortalStyles = createGlobalStyle`
  #header-root {
    position: relative;
    z-index: ${Layers.header};
  }
  
  #tooltip-root {
    position: absolute;
    top: 0;
    width: 100vw;
    z-index: ${Layers.max};
  }

  .bp3-portal {
    z-index: ${Layers.portals};
  }
`;
