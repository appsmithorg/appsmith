package com.external.plugins.constants;

/**
 * This enum keeps a list of all the special data types that need to be handled differently during smart substitution
 * . e.g. normally {"name": "Chris"} is a valid BSON document but with ObjectId type as the value the quotes need to
 * be handled differently: {"_id": ObjectId("xyz")} is valid instead of {"_id": "ObjectId(\"xyz\")"}
 */
public enum MongoSpecialDataTypes {
    ObjectId,
    ISODate,
    NumberLong,
    NumberDecimal,
    Timestamp {
        /**
         * Some data types require their argument to be wrapped inside quotes whereas the others don't. This method is
         * used to check if such a wrapping is required or not. e.g. ObjectId("xyz") vs Timestamp(1234, 1)
         *
         * @return whether wrapping inside quotes is required
         */
        @Override
        public boolean isQuotesRequiredAroundParameter() {
            return false;
        }
    },
    // BinData - not sure about this
    ;

    /**
     * Some data types require their argument to be wrapped inside quotes whereas the others don't. This method is
     * used to check if such a wrapping is required or not. e.g. ObjectId("xyz") vs Timestamp(1234, 1)
     *
     * @return whether wrapping inside quotes is required
     */
    public boolean isQuotesRequiredAroundParameter() {
        return true;
    }
}
