/* eslint-disable no-var */
declare module "*.module.css";

declare module "*.txt" {
  const filePath: string;
  export default filePath;
}

declare var CDN_URL: string;
