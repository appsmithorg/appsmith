package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OldParam {

    @JsonView(Views.Api.class)
    String key;

    @JsonView(Views.Api.class)
    String value;
}
