package com.external.plugins.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
public class UserImageContent extends UserContent {
    @JsonProperty("image_url")
    ImageUrl imageUrl;

    @Data
    @AllArgsConstructor
    public static class ImageUrl {
        String url;
    }
}
