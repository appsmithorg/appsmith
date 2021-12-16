package com.appsmith.server.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ReleaseNode {
    private String tagName;
    private String name;
    private String url;
    private String descriptionHtml;
    // The following are ISO timestamps. We are not parsing them since we don't use the values.
    private String createdAt;
    private String publishedAt;

    public ReleaseNode(String tagName) {
        this.tagName = tagName;
    }
}
