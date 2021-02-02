package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LayoutActionUpdateDTO {
    String id;
    String name;
    Boolean executeOnLoad;
}
