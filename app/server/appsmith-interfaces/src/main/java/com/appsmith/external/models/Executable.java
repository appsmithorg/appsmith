package com.appsmith.external.models;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.dtos.LayoutExecutableUpdateDTO;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.annotation.Transient;

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

    @JsonIgnore
    ExecutableConfiguration getExecutableConfiguration();

    @JsonIgnore
    String getConfigurationPath();

    @JsonIgnore
    default String getCompleteDynamicBindingPath(String fieldPath) {
        return this.getConfigurationPath() + "." + fieldPath;
    }

    @JsonIgnore
    default boolean hasExtractableBinding() {
        return false;
    }

    @JsonIgnore
    DslExecutableDTO getDslExecutable();

    String getValidName();

    @JsonIgnore
    @Transient
    String getExecutableName();

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
