package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class ResourceConfiguration {

    String url;

    AuthenticationDTO authentication;

    List<Property> properties;

    //For REST API
    List<Property> headers;

    //This field is for plugins which allow the database name to be specified outside of the connection URL. The
    //expectation from the plugins is that if the database name has been provided via this field, the database name
    //should be according to this, else if database name is null, pick the database name from the URL.
    String databaseName;
}
