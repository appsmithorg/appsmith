package com.appsmith.external.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;
import com.appsmith.external.models.EnvironmentVariable;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class EnvironmentDTO {

    String id;

    String name;

    String workspaceId;

    @Transient
    List<EnvironmentVariable> environmentVariableList;

    @Transient
    public Set<String> userPermissions = new HashSet<>();

}
