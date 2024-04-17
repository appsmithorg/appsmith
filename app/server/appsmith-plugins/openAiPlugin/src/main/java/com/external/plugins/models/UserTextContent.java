package com.external.plugins.models;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class UserTextContent extends UserContent {
    String text;
}
