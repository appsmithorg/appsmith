package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class ActionDependencyEdge {
    String source;
    String target;
}
