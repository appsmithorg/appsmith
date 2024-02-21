package com.appsmith.server.dtos.ce;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ActionMetricsCE_DTO implements Serializable {
    @JsonView(Views.Public.class)
    String actionId;

    @JsonView(Views.Public.class)
    String actionName;

    @JsonView(Views.Public.class)
    String pluginType;

    @JsonView(Views.Public.class)
    String pluginId;

    @JsonView(Views.Public.class)
    String avgExecutionTime;
}
