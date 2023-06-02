declare module "*.module.css";

declare module "*.txt" {
  const filePath: string;
  export default filePath;
}
