const b64ch =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&/_";
const b64chs = [...b64ch];
const b64tab = ((a) => {
  const tab: { [a: string]: number } = {};
  a.forEach((c, i) => (tab[c] = i));
  return tab;
})(b64chs);
const _fromCC = String.fromCharCode.bind(String);

function toBinary(string: string): string {
  const codeUnits = new Uint16Array(string.length);
  for (let i = 0; i < codeUnits.length; i++) {
    codeUnits[i] = string.charCodeAt(i);
  }
  const charCodes = new Uint8Array(codeUnits.buffer);
  let result = "";
  for (let i = 0; i < charCodes.byteLength; i++) {
    result += String.fromCharCode(charCodes[i]);
  }
  return result;
}

function fromBinary(binary: string): string {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const charCodes = new Uint16Array(bytes.buffer);
  let result = "";
  for (let i = 0; i < charCodes.length; i++) {
    result += String.fromCharCode(charCodes[i]);
  }
  return result;
}

export function btoaEncode(string: string): string {
  const converted = toBinary(string);
  return btoa(converted);
}

export function atobDecode(string: string): string {
  const decoded = atob(string);
  return fromBinary(decoded);
}

export const btoaCustom = (string: string) => {
  const bin = toBinary(string);
  let u32,
    c0,
    c1,
    c2,
    asc = "";
  const pad = bin.length % 3;
  for (let i = 0; i < bin.length; ) {
    if (
      (c0 = bin.charCodeAt(i++)) > 255 ||
      (c1 = bin.charCodeAt(i++)) > 255 ||
      (c2 = bin.charCodeAt(i++)) > 255
    )
      throw new TypeError("invalid character found");
    u32 = (c0 << 16) | (c1 << 8) | c2;
    asc +=
      b64chs[(u32 >> 18) & 63] +
      b64chs[(u32 >> 12) & 63] +
      b64chs[(u32 >> 6) & 63] +
      b64chs[u32 & 63];
  }
  return pad ? asc.slice(0, pad - 3) + "___".substring(pad) : asc;
};

export const atobCustom = (asc: string) => {
  asc = asc.replace(/\s+/g, "");
  asc += "__".slice(2 - (asc.length & 3));
  let u24,
    bin = "",
    r1,
    r2;
  for (let i = 0; i < asc.length; ) {
    u24 =
      (b64tab[asc.charAt(i++)] << 18) |
      (b64tab[asc.charAt(i++)] << 12) |
      ((r1 = b64tab[asc.charAt(i++)]) << 6) |
      (r2 = b64tab[asc.charAt(i++)]);
    bin +=
      r1 === 64
        ? _fromCC((u24 >> 16) & 255)
        : r2 === 64
        ? _fromCC((u24 >> 16) & 255, (u24 >> 8) & 255)
        : _fromCC((u24 >> 16) & 255, (u24 >> 8) & 255, u24 & 255);
  }
  return fromBinary(bin);
};
