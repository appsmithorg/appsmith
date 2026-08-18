package com.external.plugins;

import com.external.plugins.utils.CommandUtils;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class CommandUtilsTest {

    @Test
    public void testIsLegacyCompletionModel() {
        assertTrue(CommandUtils.isLegacyCompletionModel("claude-instant-1.2"));
        assertTrue(CommandUtils.isLegacyCompletionModel("claude-2.1"));
        assertTrue(CommandUtils.isLegacyCompletionModel("claude-2.0"));

        assertFalse(CommandUtils.isLegacyCompletionModel("claude-10"));
        assertFalse(CommandUtils.isLegacyCompletionModel("claude-20"));
        assertFalse(CommandUtils.isLegacyCompletionModel("claude-3-opus-20240229"));
        assertFalse(CommandUtils.isLegacyCompletionModel("claude-3-5-sonnet-20240620"));
        assertFalse(CommandUtils.isLegacyCompletionModel("claude-sonnet-4-6"));
        assertFalse(CommandUtils.isLegacyCompletionModel("claude-opus-5"));
        assertFalse(CommandUtils.isLegacyCompletionModel("claude-fable-5"));
        assertFalse(CommandUtils.isLegacyCompletionModel(null));
    }
}
