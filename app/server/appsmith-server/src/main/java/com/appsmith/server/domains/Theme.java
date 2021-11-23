package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document
public class Theme extends BaseDomain {
    private String name;
    private Properties properties;
    private String applicationId;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Properties {
        private Colors colors;
        private BorderRadius borderRadius;
        private String boxShadow;
        private String boxShadowColor;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Colors {
        private String primaryColor;
        private String backgroundColor;
    }
}
