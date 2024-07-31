"""
This is a supervisor event listener, used to capture processes log and forward
to container log. The `event_handler` function does this work.

Originally taken from https://github.com/coderanger/supervisor-stdout/blob/973ba19967cdaf46d9c1634d1675fc65b9574f6e/supervisor_stdout.py
"""

import sys


def main():
    while 1:
        print("READY", flush=True)  # transition from ACKNOWLEDGED to READY
        line = sys.stdin.readline()  # read header line from stdin
        headers = dict([x.split(":") for x in line.split()])
        data = sys.stdin.read(int(headers["len"]))  # read the event payload
        print(
            f"RESULT {len(data.encode('utf-8'))}\n{data}",
            end="",
            flush=True,
        )  # transition from READY to ACKNOWLEDGED


def event_handler(event, response):
    line, *lines = response.rstrip().decode().split("\n")
    headers = dict(x.split(":", 1) for x in line.split())
    prefix = f"{headers['processname']} {headers['channel']} | "
    print(*(prefix + l for l in lines), sep="\n", file=sys.stderr, flush=True)


if __name__ == "__main__":
    main()
