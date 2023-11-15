package com.external.plugins.models;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class UserImageContent extends UserContent {
    ImageUrl imageUrl;

    @Data
    @AllArgsConstructor
    public static class ImageUrl {
        String url;
    }
}
