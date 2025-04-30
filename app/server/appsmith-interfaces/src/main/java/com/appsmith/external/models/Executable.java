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

    RunBehaviourEnum getRunBehaviour();

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

    /**
     * This method returns all types of names that this executable can be referred to with, inside dynamic bindings
     * @return
     */
    @JsonIgnore
    @Transient
    Set<String> getExecutableNames();

    /**
     * This method returns with the only valid kind of name that an end user can use for this executable in a binding
     * @return
     */
    @JsonIgnore
    @Transient
    String getUserExecutableName();

    EntityReferenceType getEntityReferenceType();

    default LayoutExecutableUpdateDTO createLayoutExecutableUpdateDTO() {
        LayoutExecutableUpdateDTO layoutExecutableUpdateDTO = new LayoutExecutableUpdateDTO();

        layoutExecutableUpdateDTO.setId(this.getId());
        layoutExecutableUpdateDTO.setName(this.getValidName());
        layoutExecutableUpdateDTO.setRunBehaviour(this.getRunBehaviour());

        return layoutExecutableUpdateDTO;
    }

    void setExecuteOnLoad(Boolean isExecuteOnLoad);

    void setRunBehaviour(RunBehaviourEnum runBehaviour);

    @JsonIgnore
    @Transient
    Boolean isOnLoadMessageAllowed();
}
