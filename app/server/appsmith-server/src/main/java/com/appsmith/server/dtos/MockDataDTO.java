package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
public class MockDataDTO {
    @JsonView(Views.Public.class)
    String id;

    @JsonView(Views.Public.class)
    List<MockDataSet> mockdbs;

    @JsonView(Views.Public.class)
    List<MockDataCredentials> credentials;

    @JsonView(Views.Public.class)
    String name;
}
