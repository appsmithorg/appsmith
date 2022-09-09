package com.appsmith.external.models;

/**
 * This enum is responsible for indicating what data structure
 * the trigger method that has been called should conform to
 * For example, in case of DROP_DOWN, the response would be expected
 * to be an array of objects with `label` and `value` properties
 */
public enum ClientDataDisplayType {
    DROP_DOWN,
}
