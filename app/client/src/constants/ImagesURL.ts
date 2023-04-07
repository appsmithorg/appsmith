import { ASSETS_CDN_URL } from "./ThirdPartyConstants";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

export const getInfoThumbnail = () =>
  getAssetUrl(`${ASSETS_CDN_URL}/crud/crud_info_thumbnail.png`);
export const getInfoImage = (): string =>
  getAssetUrl(`${ASSETS_CDN_URL}/crud/working-flow-chart.png`);
