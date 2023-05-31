package com.appsmith.external.dtos;

import com.appsmith.external.models.Environment;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class EnvironmentDTO {

    String id;
    String name;
    String workspaceId;
    Boolean isDefault;

    @Transient
    public Set<String> userPermissions = new HashSet<>();

    public static EnvironmentDTO createEnvironmentDTO(Environment environment) {
        EnvironmentDTO environmentDTO = new EnvironmentDTO();
        environmentDTO.setId(environment.getId());
        environmentDTO.setName(environment.getName());
        environmentDTO.setWorkspaceId(environment.getWorkspaceId());
        environmentDTO.setIsDefault(environment.getIsDefault());
        environmentDTO.setUserPermissions(environment.getUserPermissions());
        return environmentDTO;
    }

}
