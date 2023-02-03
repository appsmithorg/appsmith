package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApplicationNameIdDTO {

    @JsonView(Views.Public.class)
    String id;

    @JsonView(Views.Public.class)
    String name;
}
