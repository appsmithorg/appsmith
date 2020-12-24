package com.appsmith.server.solutions;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
public class ReleaseNotesServiceTest {

    @Autowired
    private ReleaseNotesService releaseNotesService;

    @Test
    public void testComputeNewReleases() {
        releaseNotesService.releaseNodesCache.addAll(List.of(
                new ReleaseNotesService.ReleaseNode("v3"),
                new ReleaseNotesService.ReleaseNode("v2"),
                new ReleaseNotesService.ReleaseNode("v1")
        ));

        assertThat(releaseNotesService.computeNewFrom("v3")).isEqualTo("0");
        assertThat(releaseNotesService.computeNewFrom("v2")).isEqualTo("1");
        assertThat(releaseNotesService.computeNewFrom("v1")).isEqualTo("2");
        assertThat(releaseNotesService.computeNewFrom("v0")).isEqualTo("2+");
    }

}
