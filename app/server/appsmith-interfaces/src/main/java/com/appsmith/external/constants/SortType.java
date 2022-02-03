package com.appsmith.external.constants;

/**
 * This enum is used to encapsulate the Sort type used in UQI Sort feature. For more info please check out
 * `FilterDataServiceCE.java`
 */
public enum SortType {
    ASCENDING {
        @Override
        public String toString() {
            return "ASC";
        }
    },
    DESCENDING {
        @Override
        public String toString() {
            return "DESC";
        }
    }
}
