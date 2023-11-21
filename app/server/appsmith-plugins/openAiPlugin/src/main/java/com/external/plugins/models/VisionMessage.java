package com.external.plugins.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class VisionMessage {
    Role role;
    List<Object> content;
}
