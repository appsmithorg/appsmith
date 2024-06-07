package com.appsmith.external.git;

import com.appsmith.external.git.constants.ce.GitSpanCE;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;
import static com.appsmith.external.constants.spans.BaseSpan.GIT_SPAN_PREFIX;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
public class GitSpansTest {

    @Test
    public void enforceCorrectNameUsage_InGitSpansCE() throws IllegalAccessException {
        Class<?> gitSpansClass = GitSpanCE.class;
        Field[] fields = gitSpansClass.getDeclaredFields();
        for (Field field : fields) {
            if (java.lang.reflect.Modifier.isStatic(field.getModifiers())) {
                // Allow access to private fields
                field.setAccessible(true);
                String prefix = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX;
                String propertyName = field.getName();
                String propertyValue = (String) field.get(null);
                assertThat(propertyValue).isEqualTo(prefix + propertyName.toLowerCase());
            }
        }
    }
}
