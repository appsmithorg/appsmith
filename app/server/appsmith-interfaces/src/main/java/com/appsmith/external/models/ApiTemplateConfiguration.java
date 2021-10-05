package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class ApiTemplateConfiguration implements AppsmithDomain {
    String documentation; //Documentation for this particular API comes here
    String documentationUrl; //URL for this particular api's documentation comes here
    ActionExecutionResult sampleResponse;
}
