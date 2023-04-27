from requests.exceptions import ConnectionError
import os
import requests
import sys
import shutil
import time

LOADING_TEMPLATE_PAGE = r'/opt/appsmith/templates/appsmith_starting.html'
LOADING_PAGE_EDITOR = r'/opt/appsmith/editor/loading.html'
BACKEND_HEALTH_ENDPOINT = "http://localhost:8080/api/v1/health"

def write_stdout(s):
    # only eventlistener protocol messages may be sent to stdout
    sys.stdout.write(s)
    sys.stdout.flush()

def write_stderr(s):
    sys.stderr.write(s)
    sys.stderr.flush()

def wait_until_backend_healthy():
    sleep_sec = 3
    timeout_sec = 120
    for _ in range(timeout_sec//sleep_sec):
        try:
            if requests.get(BACKEND_HEALTH_ENDPOINT).ok:
                write_stderr('\nBackend is healthy\n')
                break
        except ConnectionError:
            pass # retry after sleep_sec
        except Exception as ex:
            write_stderr(ex)
            break
        finally:
            time.sleep(sleep_sec)
    else:
        write_stderr('\nError: Backend health check timeout.\n')
    remove_loading_page()
      
def remove_loading_page():
    if os.path.exists(LOADING_PAGE_EDITOR):
        os.remove(LOADING_PAGE_EDITOR)

def main():
    while True:
        # transition from ACKNOWLEDGED to READY
        write_stdout('READY\n')

        # read header line and print it to stderr
        line = sys.stdin.readline()
        write_stderr(line)

        # read event payload and print it to stderr
        headers = dict(x.split(':', 1) for x in line.split())
        data = sys.stdin.read(int(headers['len']))

        if 'PROCESS_STATE_STARTING' in line:
            data_params = dict([ x.split(':') for x in data.split()])
            if data_params['groupname'] == 'backend':
                write_stderr('\nBackend State: STARTING\n')
                shutil.copyfile(LOADING_TEMPLATE_PAGE, LOADING_PAGE_EDITOR)

        elif 'PROCESS_STATE_RUNNING' in line:
            data_params = dict([ x.split(':') for x in data.split()])
            if data_params['groupname'] == 'backend':
                write_stderr('\nBackend State: RUNNING\n')
                wait_until_backend_healthy()
                write_stderr(data)

        elif 'PROCESS_STATE_FATAL' in line:
            data_params = dict([ x.split(':') for x in data.split()])
            if data_params['groupname'] == 'backend':
                write_stderr('\nBackend State: FATAL\n')
                remove_loading_page()

        # transition from READY to ACKNOWLEDGED
        write_stdout('RESULT 2\nOK')

if __name__ == '__main__':
    main()
