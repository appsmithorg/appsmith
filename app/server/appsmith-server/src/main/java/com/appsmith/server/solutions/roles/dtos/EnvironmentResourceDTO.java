package com.appsmith.server.solutions.roles.dtos;

import com.appsmith.external.helpers.EnvironmentNameCaseStrategy;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class EnvironmentResourceDTO extends BaseView {
    String id;

    @JsonDeserialize(using = EnvironmentNameCaseStrategy.SelectiveLowerCaseNamingStrategy.class)
    @JsonSerialize(using = EnvironmentNameCaseStrategy.PascalCaseNamingStrategy.class)
    String name;
}
