package com.appsmith.external.models;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.dtos.LayoutExecutableUpdateDTO;

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

    String getConfigurationPath();

    default String getCompleteDynamicBindingPath(String fieldPath) {
        return this.getConfigurationPath() + "." + fieldPath;
    }

    default boolean hasExtractableBinding() {
        return false;
    }

    DslExecutableDTO getDslExecutable();

    String getValidName();

    EntityReferenceType getEntityReferenceType();

    DefaultResources getDefaultResources();

    default LayoutExecutableUpdateDTO createLayoutExecutableUpdateDTO() {
        LayoutExecutableUpdateDTO layoutExecutableUpdateDTO = new LayoutExecutableUpdateDTO();

        layoutExecutableUpdateDTO.setId(this.getId());
        layoutExecutableUpdateDTO.setName(this.getValidName());
        layoutExecutableUpdateDTO.setExecuteOnLoad(this.getExecuteOnLoad());
        layoutExecutableUpdateDTO.setDefaultActionId(this.getDefaultResources().getActionId());

        return layoutExecutableUpdateDTO;
    }

    void setExecuteOnLoad(Boolean isExecuteOnLoad);
}
