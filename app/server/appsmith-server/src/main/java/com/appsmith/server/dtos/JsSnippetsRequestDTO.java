package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

/**
 * This DTO will contain all the information necessary for client to request JS snippets.
 */
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class JsSnippetsRequestDTO {
    List<String> entity; // e.g. table
    List<String> field; // e.g. table_data
    String dataType; // e.g. array
    String query; // user input for searching snippet
}
