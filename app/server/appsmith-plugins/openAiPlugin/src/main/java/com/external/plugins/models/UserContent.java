package com.external.plugins.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
public class UserContent {
    String type;
    String text;

    @JsonProperty("image_url")
    ImageUrl imageUrl;

    @Data
    @AllArgsConstructor
    public static class ImageUrl {
        String url;
    }
}
