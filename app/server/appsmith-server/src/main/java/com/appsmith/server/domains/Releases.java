package com.appsmith.server.domains;

import com.appsmith.server.dtos.ReleaseNode;
import lombok.Data;

import java.util.List;

@Data
public class Releases {
    private int totalCount;
    private List<ReleaseNode> nodes;
}
