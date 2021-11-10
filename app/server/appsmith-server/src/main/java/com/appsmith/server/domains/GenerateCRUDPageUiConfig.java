package com.appsmith.server.domains;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Structure for required fields to generate CRUD page generation form
 */
@Slf4j
@NoArgsConstructor
@Data
public class GenerateCRUDPageUiConfig {
    CRUDPageUiFormType formType;
    GeneratePageColumnType columnType;
    GeneratePageTableType tableType;
    // This field will be used on server side to detect the correct page name from template application
    @JsonIgnore
    String templatePageName;
}

