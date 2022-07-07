// Note: uniqueId may be unsafe in SSR contexts if it is used create DOM IDs or otherwise cause a hydration warning. Use useSSRSafeId instead.

let idSeed = 10000;
export function uniqueId(): string {
  return `__primer_id_${idSeed++}`;
}
