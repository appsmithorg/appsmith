package com.appsmith.external.views;

/**
 * This interface is used to define the different views that can be used with the JsonView annotation.
 */
public interface Views {
    /**
     * Used with JsonView annotation to denote that a field should be visible only to the server.
     */
    interface Internal extends Public, Export {}

    /**
     * Used with JsonView annotation to denote that a field should be visible to the client.
     */
    interface Public {}

    /**
     * Used with JsonView annotation to denote that a field should be exported when exporting the Domain/DTOs.
     */
    interface Export {}
}
