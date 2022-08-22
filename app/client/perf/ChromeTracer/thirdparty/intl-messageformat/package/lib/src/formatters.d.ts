import { MessageFormatElement } from '@formatjs/icu-messageformat-parser';
export interface Formats {
    number: Record<string, Intl.NumberFormatOptions>;
    date: Record<string, Intl.DateTimeFormatOptions>;
    time: Record<string, Intl.DateTimeFormatOptions>;
}
export interface FormatterCache {
    number: Record<string, Intl.NumberFormat>;
    dateTime: Record<string, Intl.DateTimeFormat>;
    pluralRules: Record<string, Intl.PluralRules>;
}
export interface Formatters {
    getNumberFormat(...args: ConstructorParameters<typeof Intl.NumberFormat>): Intl.NumberFormat;
    getDateTimeFormat(...args: ConstructorParameters<typeof Intl.DateTimeFormat>): Intl.DateTimeFormat;
    getPluralRules(...args: ConstructorParameters<typeof Intl.PluralRules>): Intl.PluralRules;
}
export declare enum PART_TYPE {
    literal = 0,
    object = 1
}
export interface LiteralPart {
    type: PART_TYPE.literal;
    value: string;
}
export interface ObjectPart<T = any> {
    type: PART_TYPE.object;
    value: T;
}
export declare type MessageFormatPart<T> = LiteralPart | ObjectPart<T>;
export declare type PrimitiveType = string | number | boolean | null | undefined | Date;
export declare function isFormatXMLElementFn<T>(el: PrimitiveType | T | FormatXMLElementFn<T>): el is FormatXMLElementFn<T>;
export declare function formatToParts<T>(els: MessageFormatElement[], locales: string | string[], formatters: Formatters, formats: Formats, values?: Record<string, PrimitiveType | T | FormatXMLElementFn<T>>, currentPluralValue?: number, originalMessage?: string): MessageFormatPart<T>[];
export declare type FormatXMLElementFn<T, R = string | T | Array<string | T>> = (parts: Array<string | T>) => R;
//# sourceMappingURL=formatters.d.ts.map