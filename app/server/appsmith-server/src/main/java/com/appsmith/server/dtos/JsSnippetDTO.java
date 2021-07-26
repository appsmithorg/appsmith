package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

/**
 * This DTO will contain all the information necessary to describe a JS snippet.
 */
@ToString
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class JsSnippetDTO {
    List<String> args;
    String response;
    String title;
    String snippet;
    String example;
    String summary;
}
