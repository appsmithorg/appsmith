package com.appsmith.external.constants;

public enum ConditionalOperator {
    LT {
        @Override
        public String toString() {
            return "<";
        }
    },
    LTE {
        @Override
        public String toString() {
            return "<=";
        }
    },
    EQ {
        @Override
        public String toString() {
            return "==";
        }
    },
    NOT_EQ {
        @Override
        public String toString() {
            return "!=";
        }
    },
    GT {
        @Override
        public String toString() {
            return ">";
        }
    },
    GTE {
        @Override
        public String toString() {
            return ">=";
        }
    },
    ARRAY_CONTAINS {
        @Override
        public String toString() {
            return "contains";
        }
    },
    IN {
        @Override
        public String toString() {
            return "in";
        }
    },
    ARRAY_CONTAINS_ANY {
        @Override
        public String toString() {
            return "contains any";
        }
    },
    NOT_IN {
        @Override
        public String toString() {
            return "not in";
        }
    },
    AND {
        @Override
        public String toString() {
            return "and";
        }
    },
    OR {
        @Override
        public String toString() {
            return "or";
        }
    },
}
