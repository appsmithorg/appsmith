package com.appsmith.server.domains;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Sequence {

    @JsonView(Views.Public.class)
    private String name;

    @JsonView(Views.Public.class)
    private Long nextNumber;

}
