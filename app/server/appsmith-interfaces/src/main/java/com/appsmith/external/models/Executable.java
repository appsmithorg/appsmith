package com.appsmith.external.models;

import com.appsmith.external.dtos.DslExecutableDTO;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public interface Executable {

    String getId();

    Instant getDeletedAt();

    Set<String> getJsonPathKeys();

    List<Property> getDynamicBindingPathList();

    Boolean getUserSetOnLoad();

    Boolean getExecuteOnLoad();

    Set<String> getSelfReferencingDataPaths();

    ExecutableConfiguration getExecutableConfiguration();

    String getCompleteDynamicBindingPath(String fieldPath);

    default boolean hasExtractableBinding() {
        return false;
    }
    ;

    DslExecutableDTO getDslExecutable();

    String getValidName();
}
