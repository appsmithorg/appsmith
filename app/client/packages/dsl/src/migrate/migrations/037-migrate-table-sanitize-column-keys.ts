import type { ColumnProperties, DSLWidget } from "../types";
import { removeSpecialChars } from "../utils";

const getSubstringBetweenTwoWords = (
  str: string,
  startWord: string,
  endWord: string,
) => {
  const endIndexOfStartWord = str.indexOf(startWord) + startWord.length;
  const startIndexOfEndWord = str.lastIndexOf(endWord);

  if (startIndexOfEndWord < endIndexOfStartWord) return "";

  return str.substring(startIndexOfEndWord, endIndexOfStartWord);
};

/**
 * This migration sanitizes the following properties -
 * primaryColumns object key, for the value of each key - id, computedValue are sanitized
 * columnOrder
 * dynamicBindingPathList
 *
 * This migration solves the following issue -
 * https://github.com/appsmithorg/appsmith/issues/6897
 */
export const migrateTableSanitizeColumnKeys = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "TABLE_WIDGET") {
      const primaryColumnEntries: [string, ColumnProperties][] = Object.entries(
        child.primaryColumns || {},
      );

      const newPrimaryColumns: Record<string, ColumnProperties> = {};

      if (primaryColumnEntries.length) {
        for (const [, primaryColumnEntry] of primaryColumnEntries.entries()) {
          // Value is reassigned when its invalid(Faulty DSL  https://github.com/appsmithorg/appsmith/issues/8979)
          const [key] = primaryColumnEntry;
          let [, value] = primaryColumnEntry;
          const sanitizedKey = removeSpecialChars(key, 200);
          let id = "";

          if (value.id) {
            id = removeSpecialChars(value.id, 200);
          }
          // When id is undefined it's likely value isn't correct and needs fixing
          else if (Object.keys(value)) {
            const onlyKey = Object.keys(value)[0] as keyof ColumnProperties;
            const obj: ColumnProperties = value[onlyKey];

            if (!obj.id && !obj.columnType) {
              continue;
            }

            value = obj;
            id = removeSpecialChars(value.id, 200);
          }

          // Sanitizes "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.$$$random_header))}}"
          // to "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow._random_header))}}"
          const computedValue = (value?.computedValue || "").replace(
            key,
            sanitizedKey,
          );

          newPrimaryColumns[sanitizedKey] = {
            ...value,
            computedValue,
            id,
          };
        }

        child.primaryColumns = newPrimaryColumns;
      }

      // Sanitizes [ "id", "name", $$$random_header ]
      // to [ "id", "name", _random_header ]
      child.columnOrder = (child.columnOrder || []).map((co: string) =>
        removeSpecialChars(co, 200),
      );

      // Sanitizes [ {key: primaryColumns.$random.header.computedValue }]
      // to [ {key: primaryColumns._random_header.computedValue }]
      child.dynamicBindingPathList = (child.dynamicBindingPathList || []).map(
        (path: { key: string }) => {
          const pathChunks = path.key.split("."); // primaryColumns.$random.header.computedValue -> [ "primaryColumns", "$random", "header", "computedValue"]

          // tableData is a valid dynamicBindingPath and pathChunks would have just one entry
          if (pathChunks.length < 2) {
            return path;
          }

          const firstPart = pathChunks[0] + "."; // "primaryColumns."
          const lastPart = "." + pathChunks[pathChunks.length - 1]; // ".computedValue"

          const key = getSubstringBetweenTwoWords(
            path.key,
            firstPart,
            lastPart,
          ); // primaryColumns.$random.header.computedValue -> $random.header

          const sanitizedPrimaryColumnKey = removeSpecialChars(key, 200);

          return {
            key: firstPart + sanitizedPrimaryColumnKey + lastPart,
          };
        },
      );
    } else if (child.children && child.children.length > 0) {
      child = migrateTableSanitizeColumnKeys(child);
    }

    return child;
  });

  return currentDSL;
};
