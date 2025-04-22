package com.appsmith.external.models;

/**
 * Enum to define the behavior for running actions
 */
public enum RunBehaviorEnum {
    MANUAL, // Action will only run when manually triggered
    AUTOMATIC, // Action will run automatically based on triggers
    ON_PAGE_LOAD // Action will run when the page loads
}
