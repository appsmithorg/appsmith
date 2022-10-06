package com.appsmith.server.dtos;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.EnvironmentVariable;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.annotation.Transient;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@ToString
@Slf4j
public class EnvironmentVariableDTO {


    @Transient
    private String id;

    @Transient
    String environmentId;

    @Transient
    String applicationId;

    @Transient
    String workspaceId;

    String name;

    @JsonProperty(access=JsonProperty.Access.READ_ONLY)
    String value;

    @Transient
    public Set<String> userPermissions = new HashSet<>();

    @Transient
    @JsonIgnore
    protected Set<Policy> policies = new HashSet<>();

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    Instant deletedAt = null; // do we need this?

    @Transient
    DefaultResources defaultResources;

    public void sanitiseToExportDBObject() {

        this.setId(null);
        this.setEnvironmentId(null);
        this.setApplicationId(null);
        this.setWorkspaceId(null);
        this.setName(null);
        this.setDeletedAt(null);

        if (this.getUserPermissions() != null) {
            this.getUserPermissions().clear();
        }

        if (this.getPolicies() != null) {
            this.getPolicies().clear();
        }

        this.setPolicies(null);
        this.setDefaultResources(null);
        this.setValue(null);
    }

    public static EnvironmentVariableDTO createDTOFromEnvironmentVariable(EnvironmentVariable envVar) {
        EnvironmentVariableDTO envVarDTO = new EnvironmentVariableDTO();
        envVarDTO.setId(envVar.getId());
        envVarDTO.setEnvironmentId(envVar.getEnvironmentId());
        envVarDTO.setApplicationId(envVar.getApplicationId());
        envVarDTO.setWorkspaceId(envVar.getWorkspaceId());
        envVarDTO.setName(envVar.getName());
        envVarDTO.setValue(envVar.getValue());
        return envVarDTO;
    }

    public EnvironmentVariable getEnvironmentVariableFromDTO() {

        EnvironmentVariable envVar = new EnvironmentVariable();
        envVar.setId(this.getId());
        envVar.setValue(this.getValue());
        envVar.setName(this.getName());
        envVar.setApplicationId(this.getApplicationId());
        envVar.setWorkspaceId(this.getWorkspaceId());
        envVar.setDeletedAt(this.getDeletedAt());

        Set<String> userPermissions = new HashSet<>();
        envVar.setUserPermissions(userPermissions);
        if (this.getUserPermissions() != null) {
            for (String userPermission: this.getUserPermissions()) {
                userPermissions.add(userPermission);
            }
        }

        return envVar;
    }



}
