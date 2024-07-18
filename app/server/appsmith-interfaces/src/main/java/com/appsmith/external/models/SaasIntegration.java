package com.appsmith.external.models;

import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

public class SaasIntegration {
    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    String name;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    String url;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    String image_base64;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    String auth_type;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    String appsmith_docs;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    String saas_docs;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    Object headers;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    Object query_parameters;

    @JsonView({Views.Public.class, FromRequest.class, Git.class})
    Object authentication;
}
