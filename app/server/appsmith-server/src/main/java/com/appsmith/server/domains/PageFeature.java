package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PageFeature {

    String name;

    String description;

    List<String> steps;
}
