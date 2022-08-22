// MIT License
//
// Copyright (c) 2021 FormatJS
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import type { NumberFormatOptions } from '@formatjs/ecma402-abstract';
import { NumberSkeletonToken } from '@formatjs/icu-skeleton-parser';
export interface ExtendedNumberFormatOptions extends NumberFormatOptions {
    scale?: number;
}
export declare enum TYPE {
    /**
     * Raw text
     */
    literal = 0,
    /**
     * Variable w/o any format, e.g `var` in `this is a {var}`
     */
    argument = 1,
    /**
     * Variable w/ number format
     */
    number = 2,
    /**
     * Variable w/ date format
     */
    date = 3,
    /**
     * Variable w/ time format
     */
    time = 4,
    /**
     * Variable w/ select format
     */
    select = 5,
    /**
     * Variable w/ plural format
     */
    plural = 6,
    /**
     * Only possible within plural argument.
     * This is the `#` symbol that will be substituted with the count.
     */
    pound = 7,
    /**
     * XML-like tag
     */
    tag = 8
}
export declare enum SKELETON_TYPE {
    number = 0,
    dateTime = 1
}
export interface LocationDetails {
    offset: number;
    line: number;
    column: number;
}
export interface Location {
    start: LocationDetails;
    end: LocationDetails;
}
export interface BaseElement<T extends TYPE> {
    type: T;
    value: string;
    location?: Location;
}
export declare type LiteralElement = BaseElement<TYPE.literal>;
export declare type ArgumentElement = BaseElement<TYPE.argument>;
export interface TagElement {
    type: TYPE.tag;
    value: string;
    children: MessageFormatElement[];
    location?: Location;
}
export interface SimpleFormatElement<T extends TYPE, S extends Skeleton> extends BaseElement<T> {
    style?: string | S | null;
}
export declare type NumberElement = SimpleFormatElement<TYPE.number, NumberSkeleton>;
export declare type DateElement = SimpleFormatElement<TYPE.date, DateTimeSkeleton>;
export declare type TimeElement = SimpleFormatElement<TYPE.time, DateTimeSkeleton>;
export interface SelectOption {
    id: string;
    value: MessageFormatElement[];
    location?: Location;
}
export declare type ValidPluralRule = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other' | string;
export interface PluralOrSelectOption {
    value: MessageFormatElement[];
    location?: Location;
}
export interface SelectElement extends BaseElement<TYPE.select> {
    options: Record<string, PluralOrSelectOption>;
}
export interface PluralElement extends BaseElement<TYPE.plural> {
    options: Record<ValidPluralRule, PluralOrSelectOption>;
    offset: number;
    pluralType: Intl.PluralRulesOptions['type'];
}
export interface PoundElement {
    type: TYPE.pound;
    location?: Location;
}
export declare type MessageFormatElement = ArgumentElement | DateElement | LiteralElement | NumberElement | PluralElement | PoundElement | SelectElement | TagElement | TimeElement;
export interface NumberSkeleton {
    type: SKELETON_TYPE.number;
    tokens: NumberSkeletonToken[];
    location?: Location;
    parsedOptions: ExtendedNumberFormatOptions;
}
export interface DateTimeSkeleton {
    type: SKELETON_TYPE.dateTime;
    pattern: string;
    location?: Location;
    parsedOptions: Intl.DateTimeFormatOptions;
}
export declare type Skeleton = NumberSkeleton | DateTimeSkeleton;
/**
 * Type Guards
 */
export declare function isLiteralElement(el: MessageFormatElement): el is LiteralElement;
export declare function isArgumentElement(el: MessageFormatElement): el is ArgumentElement;
export declare function isNumberElement(el: MessageFormatElement): el is NumberElement;
export declare function isDateElement(el: MessageFormatElement): el is DateElement;
export declare function isTimeElement(el: MessageFormatElement): el is TimeElement;
export declare function isSelectElement(el: MessageFormatElement): el is SelectElement;
export declare function isPluralElement(el: MessageFormatElement): el is PluralElement;
export declare function isPoundElement(el: MessageFormatElement): el is PoundElement;
export declare function isTagElement(el: MessageFormatElement): el is TagElement;
export declare function isNumberSkeleton(el: NumberElement['style'] | Skeleton): el is NumberSkeleton;
export declare function isDateTimeSkeleton(el?: DateElement['style'] | TimeElement['style'] | Skeleton): el is DateTimeSkeleton;
export declare function createLiteralElement(value: string): LiteralElement;
export declare function createNumberElement(value: string, style?: string | null): NumberElement;
//# sourceMappingURL=types.d.ts.map
