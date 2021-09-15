package com.appsmith.server.solutions;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@RunWith(SpringRunner.class)
@Slf4j
public class EnvManagerTest {

    @Test
    public void simpleSample() {
        final String content = "APPSMITH_MONGODB_URI=first value\nAPPSMITH_REDIS_URL=second value\n\nAPPSMITH_INSTANCE_NAME=third value";

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("APPSMITH_MONGODB_URI", "new first value")
        )).containsExactly(
                "APPSMITH_MONGODB_URI=new first value",
                "APPSMITH_REDIS_URL=second value",
                "",
                "APPSMITH_INSTANCE_NAME=third value"
        );

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("APPSMITH_REDIS_URL", "new second value")
        )).containsExactly(
                "APPSMITH_MONGODB_URI=first value",
                "APPSMITH_REDIS_URL=new second value",
                "",
                "APPSMITH_INSTANCE_NAME=third value"
        );

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("APPSMITH_INSTANCE_NAME", "new third value")
        )).containsExactly(
                "APPSMITH_MONGODB_URI=first value",
                "APPSMITH_REDIS_URL=second value",
                "",
                "APPSMITH_INSTANCE_NAME=new third value"
        );

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of(
                        "APPSMITH_MONGODB_URI", "new first value",
                        "APPSMITH_INSTANCE_NAME", "new third value"
                )
        )).containsExactly(
                "APPSMITH_MONGODB_URI=new first value",
                "APPSMITH_REDIS_URL=second value",
                "",
                "APPSMITH_INSTANCE_NAME=new third value"
        );

    }

    @Test
    public void emptyValues() {
        final String content = "APPSMITH_MONGODB_URI=first value\nAPPSMITH_REDIS_URL=\n\nAPPSMITH_INSTANCE_NAME=third value";

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("APPSMITH_REDIS_URL", "new second value")
        )).containsExactly(
                "APPSMITH_MONGODB_URI=first value",
                "APPSMITH_REDIS_URL=new second value",
                "",
                "APPSMITH_INSTANCE_NAME=third value"
        );

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("APPSMITH_REDIS_URL", "")
        )).containsExactly(
                "APPSMITH_MONGODB_URI=first value",
                "APPSMITH_REDIS_URL=",
                "",
                "APPSMITH_INSTANCE_NAME=third value"
        );

    }

    @Test
    public void quotedValues() {
        final String content = "APPSMITH_MONGODB_URI=first value\nAPPSMITH_REDIS_URL=\"quoted value\"\n\nAPPSMITH_INSTANCE_NAME=third value";

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of(
                        "APPSMITH_MONGODB_URI", "new first value",
                        "APPSMITH_REDIS_URL", "new second value"
                )
        )).containsExactly(
                "APPSMITH_MONGODB_URI=new first value",
                "APPSMITH_REDIS_URL=\"new second value\"",
                "",
                "APPSMITH_INSTANCE_NAME=third value"
        );

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of("APPSMITH_REDIS_URL", "")
        )).containsExactly(
                "APPSMITH_MONGODB_URI=first value",
                "APPSMITH_REDIS_URL=\"\"",
                "",
                "APPSMITH_INSTANCE_NAME=third value"
        );

    }

    public void parseTest() {

        assertThat(EnvManager.parseToMap(
                "VAR_1=first value\nVAR_2=second value\n\nVAR_3=third value"
        )).containsExactlyInAnyOrderEntriesOf(Map.of(
                "VAR_1", "first value",
                "VAR_2", "second value",
                "VAR_3", "third value"
        ));

    }

    @Test
    public void parseEmptyValues() {

        assertThat(EnvManager.parseToMap(
                "VAR_1=first value\nVAR_2=\n\nVAR_3=third value"
        )).containsExactlyInAnyOrderEntriesOf(Map.of(
                "VAR_1", "first value",
                "VAR_2", "",
                "VAR_3", "third value"
        ));

    }

    @Test
    public void parseQuotedValues() {

        assertThat(EnvManager.parseToMap(
                "VAR_1=first value\nVAR_2=\"quoted value\"\n\nVAR_3=third value"
        )).containsExactlyInAnyOrderEntriesOf(Map.of(
                "VAR_1", "first value",
                "VAR_2", "quoted value",
                "VAR_3", "third value"
        ));

    }

    @Test
    public void disallowedVariable() {
        final String content = "APPSMITH_MONGODB_URI=first value\nDISALLOWED_NASTY_STUFF=\"quoted value\"\n\nAPPSMITH_INSTANCE_NAME=third value";

        assertThatThrownBy(() -> EnvManager.transformEnvContent(
                content,
                Map.of(
                        "APPSMITH_MONGODB_URI", "new first value",
                        "DISALLOWED_NASTY_STUFF", "new second value"
                )
        ))
                .matches(value -> value instanceof AppsmithException
                        && AppsmithError.UNAUTHORIZED_ACCESS.equals(((AppsmithException) value).getError()));
    }

    @Test
    public void addNewVariable() {
        final String content = "APPSMITH_MONGODB_URI=first value\nAPPSMITH_REDIS_URL=\"quoted value\"\n\nAPPSMITH_INSTANCE_NAME=third value";

        assertThat(EnvManager.transformEnvContent(
                content,
                Map.of(
                        "APPSMITH_MONGODB_URI", "new first value",
                        "APPSMITH_DISABLE_TELEMETRY", "false"
                )
        )).containsExactly(
                "APPSMITH_MONGODB_URI=new first value",
                "APPSMITH_REDIS_URL=\"quoted value\"",
                "",
                "APPSMITH_INSTANCE_NAME=third value",
                "APPSMITH_DISABLE_TELEMETRY=false"
        );
    }

}
