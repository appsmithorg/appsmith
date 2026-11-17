declare module "@uppy/locales/lib/*" {
  const locale: {
    strings: Record<string, string | Record<string, string>>;
    pluralize: (n: number) => number;
  };
  export default locale;
}
