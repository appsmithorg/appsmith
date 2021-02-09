package com.appsmith.external.models;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.util.CollectionUtils;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Setter
@ToString
public class DatasourceTestResult {

    Set<String> invalids;

    /**
     * Convenience constructor to create a result object with one or more error messages. This constructor also ensures
     * that the `invalids` field is never null.
     *
     * @param invalids String messages that explain why the test failed.
     */
    public DatasourceTestResult(String... invalids) {
        if (invalids == null) {
            invalids = new String[]{AppsmithPluginError.PLUGIN_DATASOURCE_TEST_GENERIC_ERROR.getMessage()};
        } else {
            invalids = Arrays
                    .stream(invalids)
                    .map(x -> x == null ? AppsmithPluginError.PLUGIN_DATASOURCE_TEST_GENERIC_ERROR.getMessage() : x)
                    .toArray(String[]::new);
        }

        this.invalids = Set.of(invalids);
    }

    public DatasourceTestResult(Set<String> invalids) {
        this.invalids = invalids;
    }

    public boolean isSuccess() {
        // This method exists so that a `"success"` boolean key is present in the JSON response to the frontend.
        return CollectionUtils.isEmpty(invalids);
    }

}
