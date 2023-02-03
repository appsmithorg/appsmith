package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EnvChangesResponseDTO {

    @JsonProperty(value = "isRestartRequired")
    @JsonView(Views.Public.class)
    boolean isRestartRequired;

}
