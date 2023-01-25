package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EmailTokenDTO {
    @JsonView(Views.Api.class)
    private String email;

    @JsonView(Views.Api.class)
    private String token;
}
