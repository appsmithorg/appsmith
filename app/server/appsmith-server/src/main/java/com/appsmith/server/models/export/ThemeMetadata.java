package com.appsmith.server.models.export;

import lombok.Data;

@Data
public class ThemeMetadata {
    private String name;
    private String displayName;
    private Boolean isSystemTheme;
    private Boolean deleted;
}
