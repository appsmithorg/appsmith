package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.ce.ActionViewCE_DTO;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ActionViewDTO extends ActionViewCE_DTO {
    // Needed for module instance action to show the "response viewer" of the respective plugin
    @JsonView(Views.Public.class)
    String pluginId;

    @JsonView(Views.Public.class)
    Boolean isPublic;

    @JsonView(Views.Public.class)
    String moduleInstanceId;

    @JsonView(Views.Public.class)
    Boolean executeOnLoad;
}
