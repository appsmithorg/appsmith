import { getAssetUrl } from "ee/utils/airgapHelpers";

import { ASSETS_CDN_URL } from "./ThirdPartyConstants";

export const getInfoThumbnail = () =>
  getAssetUrl(`${ASSETS_CDN_URL}/crud/crud_info_thumbnail.png`);
export const getInfoImage = (): string =>
  getAssetUrl(`${ASSETS_CDN_URL}/crud/working-flow-chart.png`);
