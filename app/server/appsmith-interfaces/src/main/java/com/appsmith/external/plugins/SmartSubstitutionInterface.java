package com.appsmith.external.plugins;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.Param;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface SmartSubstitutionInterface {

    /**
     * !Warning! - This function changes the values of arraylist insertedParams which can then be returned
     * back to the caller with all the values that were finally put during substitution
     *
     * @param input
     * @param mustacheValuesInOrder
     * @param evaluatedParams
     * @param insertedParams
     * @param args
     * @return
     * @throws AppsmithPluginException
     */
    default Object smartSubstitutionOfBindings(Object input,
                                               List<MustacheBindingToken> mustacheValuesInOrder,
                                               List<Param> evaluatedParams,
                                               List<Map.Entry<String, String>> insertedParams,
                                               Object... args) throws AppsmithPluginException {

        if (mustacheValuesInOrder != null && !mustacheValuesInOrder.isEmpty()) {

            for (int i = 0; i < mustacheValuesInOrder.size(); i++) {
                String key = mustacheValuesInOrder.get(i).getValue();
                Optional<Param> matchingParam = evaluatedParams.stream().filter(param -> param.getKey().trim().equals(key)).findFirst();

                // If the evaluated value of the mustache binding is present, set it in the prepared statement
                if (matchingParam.isPresent()) {
                    String value = matchingParam.get().getValue();

                    input = substituteValueInInput(i + 1, key,
                            value, input, insertedParams, append(args, matchingParam.get()));
                } else {
                    throw new AppsmithPluginException(AppsmithPluginError.SMART_SUBSTITUTION_VALUE_MISSING, key);
                }
            }
        }
        return input;
    }

    // Default implementation does not do any substitution. The plugin doing intelligent substitution is responsible
    // for overriding this function.
    default Object substituteValueInInput(int index, String binding, String value, Object input,
                                          List<Map.Entry<String, String>> insertedParams, Object... args) throws AppsmithPluginException {
        return input;
    }


    /**
     * This method is part of the pre-processing of the replacement value before the final substitution that
     * happens as part of smart substitution process.
     * This is the default implementation. Each plugin that implements `SmartSubstitutionInterface` is supposed to
     * override this method to provide plugin specific implementation.
     *
     * @param replacementValue - value to be substituted
     * @param dataType
     * @return - updated replacement value
     */
    default String sanitizeReplacement(String replacementValue, DataType dataType) {
        return replacementValue;
    }

    static <T> T[] append(T[] arr, T lastElement) {
        final int N = arr.length;
        arr = Arrays.copyOf(arr, N + 1);
        arr[N] = lastElement;
        return arr;
    }
}
