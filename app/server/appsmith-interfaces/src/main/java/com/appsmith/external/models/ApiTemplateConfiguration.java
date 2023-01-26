package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class ApiTemplateConfiguration implements AppsmithDomain {

    @JsonView(Views.Public.class)
    String documentation; //Documentation for this particular API comes here

    @JsonView(Views.Public.class)
    String documentationUrl; //URL for this particular api's documentation comes here

    @JsonView(Views.Public.class)
    ActionExecutionResult sampleResponse;
}
