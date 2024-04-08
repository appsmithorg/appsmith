package com.external.plugins.dtos;

import lombok.Data;

/**
 * FileMetadataDTO Metadata representation from AI Node server
 */
@Data
public class FileMetadataDTO {
    private String id;
    private String name;
    private boolean isProcessed;
    private int size;
    private String mimetype;
}
