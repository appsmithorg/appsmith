package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ReleaseNode {
    @JsonView(Views.Api.class)
    private String tagName;

    @JsonView(Views.Api.class)
    private String name;

    @JsonView(Views.Api.class)
    private String url;

    @JsonView(Views.Api.class)
    private String descriptionHtml;

    // The following are ISO timestamps. We are not parsing them since we don't use the values.
    @JsonView(Views.Api.class)
    private String createdAt;

    @JsonView(Views.Api.class)
    private String publishedAt;

    public ReleaseNode(String tagName) {
        this.tagName = tagName;
    }
}
