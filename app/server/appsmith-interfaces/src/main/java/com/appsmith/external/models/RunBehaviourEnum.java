package com.appsmith.external.models;

/**
 * Enum to define the behaviour for running actions
 */
public enum RunBehaviourEnum {
    MANUAL, // Action will only run when manually triggered
    ON_PAGE_LOAD, // Action will run when the page loads
    AUTOMATIC, // Action will run automatically (When any of its dependencies change) if the feature flag is enabled
    ON_PAGE_UNLOAD, // Action will run when the page unloads
}
