package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ReleaseNode {
    @JsonView(Views.Public.class)
    private String tagName;

    @JsonView(Views.Public.class)
    private String name;

    @JsonView(Views.Public.class)
    private String url;

    @JsonView(Views.Public.class)
    private String descriptionHtml;

    // The following are ISO timestamps. We are not parsing them since we don't use the values.
    @JsonView(Views.Public.class)
    private String createdAt;

    @JsonView(Views.Public.class)
    private String publishedAt;

    public ReleaseNode(String tagName) {
        this.tagName = tagName;
    }
}
