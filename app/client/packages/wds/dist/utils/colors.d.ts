import Color from "colorjs.io";
/**
 * returns black or white based on the constrast of the color compare to white
 * using APCA algorithm
 *
 * @param color
 * @returns
 */
export declare const getComplementaryGrayscaleColor: (hex?: string) => "#000" | "#fff";
/**
 * lightens color
 *
 * @param color
 * @param amount
 * @returns
 */
export declare const lightenColor: (hex?: string, lightness?: number) => string;
/**
 * darkens color by a given amount
 *
 * @param hex
 * @param lightness
 * @returns
 */
export declare const darkenColor: (hex?: string, lightness?: number) => string;
/**
 * calculate the hover color
 *
 * @param hex
 * @returns
 */
export declare const calulateHoverColor: (hex?: string) => string;
/**
 * Parses a color and returns a color object
 * if the color is invalid it returns black
 *
 * @param hex
 * @returns
 */
export declare const parseColor: (hex?: string) => Color;
