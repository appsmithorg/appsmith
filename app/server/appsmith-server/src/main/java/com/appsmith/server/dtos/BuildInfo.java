package com.appsmith.server.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * This class is used to parse the JSON content of the info.json file. This file is generated during the build process
 * and contains the version of the Appsmith server.
 */
@Data
public class BuildInfo {
    private String version;

    @JsonProperty("imageBuiltAt")
    private String buildTimestamp;
}
