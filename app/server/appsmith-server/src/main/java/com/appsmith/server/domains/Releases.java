/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.domains;

import com.appsmith.server.dtos.ReleaseNode;
import java.util.List;
import lombok.Data;

@Data
public class Releases {
private int totalCount;
private List<ReleaseNode> nodes;
}
