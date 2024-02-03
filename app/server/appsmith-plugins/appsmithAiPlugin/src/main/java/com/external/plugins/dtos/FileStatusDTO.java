package com.external.plugins.dtos;

import lombok.Data;

import java.util.List;

@Data
public class FileStatusDTO {
    private List<FileMetadataDTO> files;
}
