package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonView;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Provider extends BaseDomain {

    @Indexed(unique = true)
    @JsonView(Views.Public.class)
    String name; //Provider name here

    @JsonView(Views.Public.class)
    String description; //Provider company's description here

    @JsonView(Views.Public.class)
    String url;

    @JsonView(Views.Public.class)
    String imageUrl;

    @JsonView(Views.Public.class)
    String documentationUrl; //URL which points to the homepage of the documentations here

    @JsonView(Views.Public.class)
    String credentialSteps; //How to generate/get the credentials to run the APIs which belong to this provider

    @JsonView(Views.Public.class)
    List<String> categories; //Category names here

    @JsonView(Views.Public.class)
    Statistics statistics; //Cumulative statistics for all the APIs for this provider

    @JsonView(Views.Public.class)
    DatasourceConfiguration datasourceConfiguration;

    @JsonView(Views.Public.class)
    List<PricingPlan> pricingPlans;

    @JsonView(Views.Public.class)
    String planSubscribed;

    /**
     * TODO : Once the marketplace is up, remove the default values from here. Let the Marketplace handle the defaults.
     */
    @JsonView(Views.Public.class)
    Boolean isVisible = true;

    @JsonView(Views.Public.class)
    Integer sortOrder = 1000;

}
