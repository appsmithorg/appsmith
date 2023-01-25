package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Documentation {
    @JsonView(Views.Api.class)
    String text;
    @JsonView(Views.Api.class)
    String url;
}
