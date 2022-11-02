package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;
import com.appsmith.server.domains.EnvironmentVariable;

import java.util.List;

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

}
