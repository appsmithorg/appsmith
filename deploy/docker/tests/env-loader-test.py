"""Configuration boundary regressions for GHSA-h6hh-wqxc-5hw9."""

import os
import json
import random
import shlex
from pathlib import Path
import subprocess
import tempfile
import unittest


APP = Path(__file__).resolve().parents[1] / "fs/opt/appsmith"


class EnvLoaderTest(unittest.TestCase):
    def test_ghsa_h6hh_embedded_pg_helper_does_not_evaluate_environment(self):
        # Exercise the helper independently of startup's environment snapshot.
        # This is a hardening regression, not evidence of a reachable boot exploit.
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            marker = root / "executed"
            log = root / "commands.jsonl"
            executable = root / "fake-pg"
            executable.write_text(
                '#!/usr/bin/env python3\n'
                'import json, os, pathlib, sys\n'
                'name = pathlib.Path(sys.argv[0]).name\n'
                'query = sys.stdin.read() if name == "psql" else ""\n'
                'with open(os.environ["COMMAND_LOG"], "a") as log:\n'
                '    log.write(json.dumps([name, sys.argv[1:], query]) + "\\n")\n'
                'if name == os.environ.get("FAIL_COMMAND"): sys.exit(7)\n'
                'if name == "psql": print(os.environ["DB_PRESENT"])\n'
            )
            executable.chmod(0o700)
            for name in ["pg_ctl", "pg_isready", "psql", "createdb"]:
                (root / name).symlink_to(executable)
            source = (APP / "entrypoint.sh").read_text()
            helper = source[source.index("create_appsmith_pg_db() {"):source.index("\nsetup_caddy()")]
            # Simulate su's shell argument forwarding without switching users.
            harness = '''
set -e
su() {
  if [[ $2 == -c ]]; then
    bash -c "$3"
  else
    [[ $1 == postgres && $2 == -s && $3 == /bin/sh && $4 == -c && $6 == -- ]]
    /bin/sh -c "$5" "${@:7}"
  fi
}
get_unix_socket_directory() { printf /tmp; }
tlog() { :; }
'''
            for present, failure in [("", ""), ("1", ""), ("", "psql"), ("", "createdb")]:
                log.write_text("")
                result = subprocess.run(["bash", "-c", harness + helper + '\ncreate_appsmith_pg_db "$1"',
                                         "test", "/tmp/postgres-test-data"], input="", capture_output=True, text=True,
                                        env=dict(os.environ, PATH=str(root) + os.pathsep + os.environ["PATH"],
                                                 COMMAND_LOG=str(log), DB_PRESENT=present,
                                                 FAIL_COMMAND=failure,
                                                 APPSMITH_PG_DATABASE=f"$(touch {marker})"))
                self.assertEqual(result.returncode, 7 if failure else 0, result.stderr)
                self.assertFalse(marker.exists(), "database helper evaluated an environment value")
                commands = [json.loads(line) for line in log.read_text().splitlines()]
                query = next(command for command in commands if command[0] == "psql")
                self.assertIn("pg_database=appsmith", query[1])
                self.assertIn(":'pg_database'", query[2])
                creates = [command for command in commands if command[0] == "createdb"]
                self.assertEqual(len(creates), 0 if present or failure == "psql" else 1)
                if creates:
                    self.assertEqual(creates[0][1], ["--", "appsmith"])
                self.assertEqual(commands[-1][0], "pg_ctl")
                self.assertEqual(commands[-1][1][-1], "stop")
            self.assertNotIn("APPSMITH_PG_DATABASE", source)

    def test_shell_serializers_round_trip(self):
        generator = random.Random(15243)
        alphabet = "abcXYZ09 '$`\\\";#=(){}[]*!?雪"
        expected = {}
        lines = []
        for number in range(100):
            value = "".join(generator.choice(alphabet) for _ in range(40))
            java_quoted = ("'" + value.replace("'", "'\"'\"'") + "'")
            if java_quoted.startswith("''"):
                java_quoted = java_quoted[2:]
            if java_quoted.endswith("''"):
                java_quoted = java_quoted[:-2]
            for suffix, raw in [("JAVA", java_quoted), ("SHELL", shlex.quote(value))]:
                key = f"APPSMITH_TEST_{number}_{suffix}"
                lines.append(f"{key}={raw}")
                expected[key] = value
        result = self.parse("\n".join(lines))
        self.assertEqual(result.returncode, 0, result.stderr)
        actual = dict(record.split("=", 1) for record in result.stdout.decode().split("\0")[:-1])
        self.assertEqual(actual, expected)

    def test_generated_defaults_and_existing_config_through_startup(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = (APP / "entrypoint.sh").read_text()
            startup = source[source.index("init_env_file() {"):source.index("\ninit_env_file\n")]
            startup = startup.replace("/appsmith-stacks/configuration", str(root / "configuration"))
            startup = startup.replace("/opt/appsmith/templates", str(APP / "templates"))
            startup = startup.replace("/opt/appsmith/env-file.py", str(APP / "env-file.py"))
            command = 'set -e; tlog() { :; }; source "$1";\n' + startup + '\ninit_env_file\n'
            command += '/usr/bin/python3 -c \'import os; print(os.environ["APPSMITH_MONGODB_USER"])\''
            environment = {"PATH": os.environ["PATH"], "TMP": str(root)}
            for _ in range(2):
                result = subprocess.run(["bash", "-c", command, "test", str(APP / "load-env.sh")],
                                        env=environment, capture_output=True, text=True)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(result.stdout.strip(), "appsmith")
            config = root / "configuration/docker.env"
            before = config.read_bytes()
            marker = root / "should-not-execute"
            config.write_text(before.decode() + f"\nAPPSMITH_INSTANCE_NAME=$(touch {marker})\n")
            result = subprocess.run(["bash", "-c", command, "test", str(APP / "load-env.sh")],
                                    env=environment, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("shell expression", result.stderr)
            self.assertFalse(marker.exists())
            self.assertEqual((root / "pre-define.json").stat().st_mode & 0o777, 0o600)

    def parse(self, content):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "docker.env"
            path.write_bytes(content.encode())
            return subprocess.run(["/usr/bin/python3", str(APP / "env-file.py"), "env", str(path)],
                                  capture_output=True)

    def test_writer_and_template_values(self):
        cases = {
            "": "",
            "'hello world'": "hello world",
            '"0 0 * * *"': "0 0 * * *",
            "'Sponge-bob'\"'\"'s Instance'": "Sponge-bob's Instance",
            "'hello'\\''world'": "hello'world",
            "'$(command); `command` ${VALUE}'": "$(command); `command` ${VALUE}",
            "rediss://:password@host/db?a=b#fragment": "rediss://:password@host/db?a=b#fragment",
            "'雪\\path'": "雪\\path",
            '"escaped\\$dollar"': "escaped$dollar",
            "'trailing\\'": "trailing\\",
            "unquoted\\\\": "unquoted\\",
        }
        for raw, expected in cases.items():
            with self.subTest(raw=raw):
                result = self.parse(f"APPSMITH_INSTANCE_NAME={raw}\n")
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(result.stdout, f"APPSMITH_INSTANCE_NAME={expected}\0".encode())

    def test_comments_crlf_duplicate_and_missing_final_newline(self):
        result = self.parse("# comment\r\n\r\nAPPSMITH_INSTANCE_NAME=first\r\nAPPSMITH_INSTANCE_NAME=last")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, b"APPSMITH_INSTANCE_NAME=last\0")

    def test_shell_whitespace_and_comment_compatibility(self):
        for raw, expected in [("true # note", "true"), ("true \t", "true"),
                              ("#abc", "#abc"), ("'true '", "true "),
                              (r"value\ #suffix", "value #suffix"),
                              ('"value " # note', "value ")]:
            with self.subTest(raw=raw):
                result = self.parse("APPSMITH_TEST=" + raw)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(result.stdout, f"APPSMITH_TEST={expected}\0".encode())

    def test_known_runtime_names(self):
        for name in ["NEW_RELIC_LICENSE_KEY", "NEW_RELIC_APP_NAME", "JAVA_OPTS_APPEND",
                     "JGROUPS_DISCOVERY_PROTOCOL", "FILESTORE_IP_ADDRESS", "FILE_SHARE_NAME", "PORT"]:
            with self.subTest(name=name):
                result = self.parse(f"{name}='literal value'")
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(result.stdout, f"{name}=literal value\0".encode())

    def test_ghsa_h6hh_expression_migration_is_fail_closed_and_redacted(self):
        for expression in ['${PASSWORD}', '$PASSWORD', '$(printf secret)', '`printf secret`',
                           '"${PASSWORD}"', '"$(printf secret)"', '$1', '$?', '~/.secret',
                           "$'secret\\n'", '$"secret"', '$[1+2]']:
            result = self.parse("APPSMITH_ENCRYPTION_PASSWORD=" + expression)
            self.assertNotEqual(result.returncode, 0, expression)
            self.assertEqual(result.stdout, b"")
            self.assertIn(b"shell expression", result.stderr)
            self.assertNotIn(b"secret", result.stderr)
        for raw in ["'$(printf secret)'", r"\$(printf\ secret)", "'${PASSWORD}'"]:
            self.assertEqual(self.parse("APPSMITH_ENCRYPTION_PASSWORD=" + raw).returncode, 0)

    def test_snapshot_round_trips_lowercase_names_and_non_utf8_bytes(self):
        with tempfile.TemporaryDirectory() as directory:
            snapshot = Path(directory) / "snapshot.json"
            environment = dict(os.environ, APPSMITH_customFlag="yes", APPSMITH_BYTES="\udcff")
            result = subprocess.run(["/usr/bin/python3", str(APP / "env-file.py"), "snapshot", str(snapshot)],
                                    env=environment, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            result = subprocess.run(["/usr/bin/python3", str(APP / "env-file.py"), "json", str(snapshot)],
                                    capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn(b"APPSMITH_customFlag=yes\0", result.stdout)
            self.assertIn(b"APPSMITH_BYTES=\xff\0", result.stdout)

    def test_merge_serializes_literals_and_validates_before_emitting(self):
        values = {"APPSMITH_ENCRYPTION_PASSWORD": "'a\\b $(secret) # ;", "APPSMITH_ENCRYPTION_SALT": "salt"}
        result = subprocess.run(["/usr/bin/python3", str(APP / "env-file.py"), "merge", "-"],
                                input=json.dumps({"content": "APPSMITH_INSTANCE_NAME=old", "values": values}).encode(),
                                capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        parsed = self.parse(result.stdout.decode())
        self.assertEqual(parsed.returncode, 0, parsed.stderr)
        self.assertIn(("APPSMITH_ENCRYPTION_PASSWORD=" + values["APPSMITH_ENCRYPTION_PASSWORD"] + "\0").encode(), parsed.stdout)
        for content, overrides in [("APPSMITH_NAME=${SECRET}", {}), ("PATH=bad", {}),
                                    ("", {"APPSMITH_ENCRYPTION_PASSWORD": "private\nvalue"})]:
            result = subprocess.run(["/usr/bin/python3", str(APP / "env-file.py"), "merge", "-"],
                                    input=json.dumps({"content": content, "values": overrides}).encode(), capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(result.stdout, b"")
            self.assertNotIn(b"private", result.stderr)

    def test_invalid_input_is_atomic_and_redacted(self):
        for invalid in ["command secret", "PATH=secret", "BASH_ENV=secret", "LD_PRELOAD=secret",
                        "APPSMITH_NAME='secret", "APPSMITH_NAME=secret\0", "APPSMITH_NAME=secret\\"]:
            with self.subTest(invalid=invalid):
                result = self.parse("APPSMITH_INSTANCE_NAME=valid\n" + invalid)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(result.stdout, b"")
                self.assertIn(b"line 2", result.stderr)
                self.assertNotIn(b"secret", result.stderr)

    def test_diagnostics_identify_variable_without_disclosing_values(self):
        for name, raw in [("APPSMITH_DB_URL", '"mongodb://private:${PASSWORD}@host"'),
                          ("MONGODB_PASS", "private"),
                          ("APPSMITH_ENCRYPTION_PASSWORD", "'private")]:
            with self.subTest(name=name):
                result = self.parse(f"# config\n{name}={raw}")
                self.assertNotEqual(result.returncode, 0)
                self.assertIn(f"line 2 ({name}):".encode(), result.stderr)
                self.assertNotIn(b"private", result.stderr)
                self.assertNotIn(b"${PASSWORD}", result.stderr)
                self.assertEqual(result.stdout, b"")

        # Malformed lines must not expose arbitrary text as a variable name.
        for invalid in ["private", "private data=value", "private\x1b[31m=value",
                        "private" * 100 + "=value"]:
            result = self.parse(invalid)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn(b"line 1:", result.stderr)
            self.assertNotIn(b"private", result.stderr)
            self.assertNotIn(b"\x1b", result.stderr)

    def test_external_snapshot_preserves_values_and_overrides_file(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            snapshot = root / "pre-define.json"
            value = "Vault's \\\"secret\\\"\n${REFERENCE}\nAPPSMITH_INJECTED=bad"
            environment = dict(os.environ, APPSMITH_INSTANCE_NAME=value)
            subprocess.run(["/usr/bin/python3", str(APP / "env-file.py"), "snapshot", str(snapshot)],
                           env=environment, check=True)
            self.assertEqual(json.loads(snapshot.read_text())["APPSMITH_INSTANCE_NAME"], value)
            config = root / "docker.env"
            config.write_text("APPSMITH_INSTANCE_NAME=stored\n")
            result = subprocess.run([
                "bash", "-euc", 'source "$1"; load_env_file env "$2"; load_env_file json "$3"; '
                '/usr/bin/python3 -c \'import os; print(repr(os.environ["APPSMITH_INSTANCE_NAME"]))\'',
                "test", str(APP / "load-env.sh"), str(config), str(snapshot),
            ], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(result.stdout.strip(), repr(value))

    def test_ghsa_h6hh_restart_does_not_execute_configuration(self):
        # Exercise the production restart wrapper with isolated fixture paths.
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            marker = root / "executed"
            config = root / "docker.env"
            config.write_text(f"APPSMITH_INSTANCE_NAME=$(touch {marker})\n")
            (root / "pre-define.env").write_text("")
            (root / "pre-define.json").write_text("{}")
            wrapper = (APP / "run-with-env.sh").read_text().replace(
                "/appsmith-stacks/configuration/docker.env", str(config)
            ).replace('"$(dirname "$0")/load-env.sh"', f'"{APP}/load-env.sh"')
            environment = dict(os.environ, TMP=str(root), APPSMITH_GIT_ROOT=str(root / "git"))
            result = subprocess.run(
                ["bash", "-c", 'tlog() { :; };\n' + wrapper, "test", "/usr/bin/true"],
                env=environment, capture_output=True, text=True,
            )
            self.assertFalse(marker.exists(), "docker.env executed a shell command")
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("shell expression", result.stderr)

    def test_restart_refuses_invalid_file_and_does_not_launch_service(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = root / "docker.env"
            config.write_text("APPSMITH_INSTANCE_NAME='private-value\n")
            marker = root / "service-started"
            wrapper = (APP / "run-with-env.sh").read_text().replace(
                "/appsmith-stacks/configuration/docker.env", str(config)
            ).replace('"$(dirname "$0")/load-env.sh"', f'"{APP}/load-env.sh"')
            result = subprocess.run(
                ["bash", "-c", 'tlog() { :; };\n' + wrapper, "test", "/usr/bin/touch", str(marker)],
                env=dict(os.environ, TMP=str(root)), capture_output=True, text=True,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse(marker.exists())
            self.assertNotIn("private-value", result.stderr)


if __name__ == "__main__":
    unittest.main()
