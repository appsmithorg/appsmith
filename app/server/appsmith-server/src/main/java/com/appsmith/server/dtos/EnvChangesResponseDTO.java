package com.appsmith.server.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EnvChangesResponseDTO {

    @JsonProperty(value = "isRestartRequired")
    boolean isRestartRequired;

}
