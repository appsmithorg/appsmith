// tsconfig uses "moduleResolution": "node", which ignores package "exports",
// so the native subpath needs the package's main types.
declare module "@zip.js/zip.js/index-native.js" {
  export * from "@zip.js/zip.js";
}
