package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class ApiTemplate extends BaseDomain {

    // ApiTemplate fields below :
    @JsonView(Views.Api.class)
    String name; //API name here

    @JsonView(Views.Api.class)
    String providerId; //Providers, e.g. Salesforce should exist in the db and its id should come here.

    @JsonView(Views.Api.class)
    String publisher; //e.g. RapidAPI

    @JsonView(Views.Api.class)
    String packageName; //Plugin package name used to execute the final action created by this template

    @JsonView(Views.Api.class)
    String versionId;

    @JsonView(Views.Api.class)
    ApiTemplateConfiguration apiTemplateConfiguration;

    @JsonView(Views.Api.class)
    ActionConfiguration actionConfiguration;

    @JsonView(Views.Api.class)
    DatasourceConfiguration datasourceConfiguration;

    @JsonView(Views.Api.class)
    String hashValue;

    @JsonView(Views.Api.class)
    String scraperId;
}
