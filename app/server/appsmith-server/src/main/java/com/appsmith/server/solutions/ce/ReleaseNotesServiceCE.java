package com.appsmith.server.solutions.ce;

import com.appsmith.server.dtos.ReleaseNode;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ReleaseNotesServiceCE {

    Mono<List<ReleaseNode>> getReleaseNodes();

    String computeNewFrom(String version);

    String getReleasedVersion();

    void refreshReleaseNotes();

    List<ReleaseNode> getReleaseNodesCache();

    void setReleaseNodesCache(List<ReleaseNode> nodes);

}
