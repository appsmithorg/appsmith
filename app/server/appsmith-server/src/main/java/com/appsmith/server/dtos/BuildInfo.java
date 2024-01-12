package com.appsmith.server.dtos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * This class is used to parse the JSON content of the info.json file. This file is generated during the build process
 * and contains the version of the Appsmith server.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class BuildInfo {
    private String version;

    private String commitSha;
}
