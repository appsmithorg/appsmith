package com.appsmith.server.solutions;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
@Getter
@Slf4j
public class ReleaseNotes {

    private final Releases releases;

    @Data
    static class Releases {
        private int totalCount;
        private List<ReleaseNode> nodes;
    }

    @Data
    @NoArgsConstructor
    public static class ReleaseNode {
        private String tagName;
        private String name;
        private String url;
        // The following are ISO timestamps. We are not parsing them since we don't use the values.
        private String createdAt;
        private String publishedAt;

        public ReleaseNode(String tagName) {
            this.tagName = tagName;
        }
    }

    public ReleaseNotes() {
        final ObjectMapper objectMapper = new ObjectMapper();

        Releases releasesTemp;
        try {
            releasesTemp = objectMapper.readValue(
                    getClass().getClassLoader().getResourceAsStream("release-notes.json"),
                    Releases.class
            );

        } catch (IOException e) {
            log.error("Error parsing JSON in release-notes.json file. Release notes information won't be available.", e);
            releasesTemp = null;

        }

        releases = releasesTemp;
    }

    public ReleaseNotes(Releases releases) {
        this.releases = releases;
    }

    public List<ReleaseNode> getReleaseNodes() {
        return releases == null ? Collections.emptyList() : releases.getNodes();
    }

    public String computeNewFrom(String version) {
        if (releases == null) {
            return "0";
        }

        int newCount = 0;

        for (ReleaseNode node : releases.getNodes()) {
            if (version == null || version.equals(node.getTagName())) {
                break;
            } else {
                ++newCount;
            }
        }

        return newCount == releases.getNodes().size() ? ((newCount - 1) + "+") : String.valueOf(newCount);
    }

}
