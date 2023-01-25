package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
public class MockDataDTO {
    @JsonView(Views.Api.class)
    String id;

    @JsonView(Views.Api.class)
    List<MockDataSet> mockdbs;

    @JsonView(Views.Api.class)
    List<MockDataCredentials> credentials;

    @JsonView(Views.Api.class)
    String name;
}
