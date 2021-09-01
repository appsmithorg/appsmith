package com.appsmith.server.solutions;

import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@Slf4j
public class EnvManagerTest {

    @Test
    public void simpleSample() {
        final String content = "VAR_1=first value\nVAR_2=second value\n\nVAR_3=third value";

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("VAR_1", "new first value")
        )).containsExactly(
                "VAR_1=new first value",
                "VAR_2=second value",
                "",
                "VAR_3=third value"
        );

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("VAR_2", "new second value")
        )).containsExactly(
                "VAR_1=first value",
                "VAR_2=new second value",
                "",
                "VAR_3=third value"
        );

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("VAR_3", "new third value")
        )).containsExactly(
                "VAR_1=first value",
                "VAR_2=second value",
                "",
                "VAR_3=new third value"
        );

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of(
                        "VAR_1", "new first value",
                        "VAR_3", "new third value"
                )
        )).containsExactly(
                "VAR_1=new first value",
                "VAR_2=second value",
                "",
                "VAR_3=new third value"
        );

    }

    @Test
    public void emptyValues() {
        final String content = "VAR_1=first value\nVAR_2=\n\nVAR_3=third value";

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("VAR_2", "new second value")
        )).containsExactly(
                "VAR_1=first value",
                "VAR_2=new second value",
                "",
                "VAR_3=third value"
        );

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("VAR_2", "")
        )).containsExactly(
                "VAR_1=first value",
                "VAR_2=",
                "",
                "VAR_3=third value"
        );

    }

    @Test
    public void quotedValues() {
        final String content = "VAR_1=first value\nVAR_2=\"quoted value\"\n\nVAR_3=third value";

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of(
                        "VAR_1", "new first value",
                        "VAR_2", "new second value"
                )
        )).containsExactly(
                "VAR_1=new first value",
                "VAR_2=\"new second value\"",
                "",
                "VAR_3=third value"
        );

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("VAR_2", "")
        )).containsExactly(
                "VAR_1=first value",
                "VAR_2=\"\"",
                "",
                "VAR_3=third value"
        );

    }

}
