package com.external.plugins.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class VisionMessage {
    Role role;
    Object content;
}
