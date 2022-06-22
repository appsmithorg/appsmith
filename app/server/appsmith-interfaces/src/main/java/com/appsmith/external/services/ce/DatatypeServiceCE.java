package com.appsmith.external.services.ce;

import com.appsmith.external.datatypes.AppsmithType;

import java.util.List;

/**
 * This service is responsible for identifying and converting data to and from recognized Appsmith types.
 * The process of identification and conversion is standardized, however plugins are free to choose
 * specific implementations for each data type that is unique to them.
 */
public interface DatatypeServiceCE {

    /**
     * This method is to be used to figure out the Appsmith type for the given input,
     * when the integration would like to use its own types
     *
     * @param originalValue The string value whose type we need to detect
     * @param possibleTypes A list of possible Appsmith types for this plugin
     * @return The Appsmith type to use for further processing
     */
    AppsmithType getAppsmithType(String originalValue, List<AppsmithType> possibleTypes);

    /**
     * This method is to be used to figure out the Appsmith type for the given input,
     * when the integration would like to use the default types provided within the Appsmith default implementation
     *
     * @param originalValue The string value whose type we need to detect
     * @return The Appsmith type to use for further processing
     */
    AppsmithType getAppsmithType(String originalValue);
}
