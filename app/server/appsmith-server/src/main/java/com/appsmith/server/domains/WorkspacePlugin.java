package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Views;
import com.appsmith.server.dtos.WorkspacePluginStatus;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class WorkspacePlugin extends BaseDomain {

    @JsonView(Views.Public.class)
    String pluginId;

    @JsonView(Views.Public.class)
    WorkspacePluginStatus status;

}
