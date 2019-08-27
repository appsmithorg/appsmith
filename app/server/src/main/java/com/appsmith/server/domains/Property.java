package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Property {

    String key;

    String value;

    Boolean editable;

    Boolean internal;
}
