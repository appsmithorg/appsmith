package com.external.plugins.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * FileMetadataDTO Metadata representation from AI Node server
 */
@Data
public class FileMetadataDTO {
    private String id;
    private String name;

    @JsonProperty("processed")
    private boolean isProcessed;

    private int size;
    private String mimetype;
}
