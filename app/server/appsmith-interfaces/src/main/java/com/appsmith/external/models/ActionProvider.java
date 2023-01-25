package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ActionProvider {
    @JsonView(Views.Api.class)
    String name;

    @JsonView(Views.Api.class)
    String imageUrl;

    @JsonView(Views.Api.class)
    String url;

    @JsonView(Views.Api.class)
    String description;

    @JsonView(Views.Api.class)
    String credentialSteps;
}
