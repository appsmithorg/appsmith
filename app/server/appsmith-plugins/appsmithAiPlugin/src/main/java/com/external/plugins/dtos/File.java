package com.external.plugins.dtos;

import lombok.Data;

@Data
public class File {
    private String id;
    private String name;
    private boolean isProcessed;
}
