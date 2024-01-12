import sys


def write_stdout(s):
    sys.stdout.write(s)
    sys.stdout.flush()


def write_stderr(s):
    sys.stderr.write(s)
    sys.stderr.flush()


def main():
    while 1:
        write_stdout("READY\n")  # transition from ACKNOWLEDGED to READY
        line = sys.stdin.readline()  # read header line from stdin
        headers = dict([x.split(":") for x in line.split()])
        data = sys.stdin.read(int(headers["len"]))  # read the event payload
        write_stdout(
            "RESULT %s\n%s" % (len(data.encode("utf-8")), data)
        )  # transition from READY to ACKNOWLEDGED


def event_handler(event, response):
    response = response.decode()
    line, data = response.split("\n", 1)
    headers = dict([x.split(":") for x in line.split()])
    lines = data.split("\n")
    prefix = "%s %s | " % (headers["processname"], headers["channel"])
    print("\n".join([prefix + l for l in lines]))


if __name__ == "__main__":
    main()
