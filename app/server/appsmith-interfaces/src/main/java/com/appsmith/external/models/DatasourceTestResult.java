package com.appsmith.external.models;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.util.CollectionUtils;

import java.util.Set;

@Getter
@Setter
@ToString
public class DatasourceTestResult {

    Set<String> invalids;

    /**
     * Convenience constructor to create a result object with one or more error messages. This constructor also ensures
     * that the `invalids` field is never null.
     * @param invalids String messages that explain why the test failed.
     */
    public DatasourceTestResult(String... invalids) {
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
