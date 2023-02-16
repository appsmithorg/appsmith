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
    // the idea is that only the request payload to update the environment would have the datasourceId
    // we will use this id to invalidate the cache entries in datasourceContextMap using this datasourceId
    String datasourceId;
    @Transient
    List<EnvironmentVariable> environmentVariableList;

    @Transient
    public Set<String> userPermissions = new HashSet<>();

}
