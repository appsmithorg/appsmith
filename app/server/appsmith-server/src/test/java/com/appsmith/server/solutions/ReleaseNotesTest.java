package com.appsmith.server.solutions;

import org.junit.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class ReleaseNotesTest {

    @Test
    public void testComputeNewReleases() {
        final ReleaseNotes.Releases releases = new ReleaseNotes.Releases();
        releases.setTotalCount(20);
        releases.setNodes(List.of(
                new ReleaseNotes.ReleaseNode("v3"),
                new ReleaseNotes.ReleaseNode("v2"),
                new ReleaseNotes.ReleaseNode("v1")
        ));

        final ReleaseNotes releaseNotes = new ReleaseNotes(releases);

        assertThat(releaseNotes.computeNewFrom("v3")).isEqualTo("0");
        assertThat(releaseNotes.computeNewFrom("v2")).isEqualTo("1");
        assertThat(releaseNotes.computeNewFrom("v1")).isEqualTo("2");
        assertThat(releaseNotes.computeNewFrom("v0")).isEqualTo("2+");
    }

}
