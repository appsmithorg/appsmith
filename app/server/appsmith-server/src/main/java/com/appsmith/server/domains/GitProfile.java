package com.appsmith.server.domains;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Document
public class GitProfile {

    @JsonView(Views.Public.class)
    String authorName;

    @JsonView(Views.Public.class)
    String authorEmail;

    @JsonView(Views.Public.class)
    Boolean useGlobalProfile;
}
