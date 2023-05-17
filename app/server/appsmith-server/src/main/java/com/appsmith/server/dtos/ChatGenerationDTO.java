package com.appsmith.server.dtos;

import com.appsmith.external.models.DatasourceStructure;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ChatGenerationDTO {

    @JsonProperty("user_query")
    String userQuery;

    @JsonProperty("api_context")
    Object apiContext;

    ChatGenerationMeta meta;

    @AllArgsConstructor
    @NoArgsConstructor
    @Data
    public static class ChatGenerationMeta {
        String datasourceId;

        ChatGenerationDatasourceStructure datasourceStructure;

    }

    @AllArgsConstructor
    @NoArgsConstructor
    @Data
    public static class ChatGenerationDatasourceStructure {
        String pluginName;

        String datasourceName;

        DatasourceStructure structure;
    }
}
