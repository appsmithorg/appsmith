package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApplicationNameIdDTO {

    @JsonView(Views.Api.class)
    String id;

    @JsonView(Views.Api.class)
    String name;
}
