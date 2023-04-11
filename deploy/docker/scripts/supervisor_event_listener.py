import sys, shutil, requests, time, os

LOADING_TEMPLATE_PAGE = r'/opt/appsmith/templates/appsmith_starting.html'
LOADING_PAGE_EDITOR = r'/opt/appsmith/editor/loading.html'
BACKEND_HEALTH_ENDPOINT = "http://localhost/api/v1/health"
LOADING_PAGE_TIMEOUT_IN_SEC = 45

def write_stdout(*args):
    # only eventlistener protocol messages may be sent to stdout
    print(*args, flush=True)

def write_stderr(s):
    sys.stderr.write(s)
    sys.stderr.flush()

def wait_until_backend_healthy(timeout):
    response = requests.get(BACKEND_HEALTH_ENDPOINT)
    while(response.status_code!=200 and timeout>0):
      time.sleep(3)
      timeout-=3
      response = requests.get(BACKEND_HEALTH_ENDPOINT)
    
    if (response.status_code == 200):
      write_stderr('\nBackend is healthy\n')
    else:
      write_stderr('\nBackend  health timeout\n')
    remove_loading_page()

def remove_loading_page():
   if os.path.exists(LOADING_PAGE_EDITOR):
      os.remove(LOADING_PAGE_EDITOR)

def main():
    while 1:
        # transition from ACKNOWLEDGED to READY
        write_stdout('READY\n')

        # read header line and print it to stderr
        line = sys.stdin.readline()
        write_stderr(line)

        # read event payload and print it to stderr
        headers = dict([ x.split(':') for x in line.split() ])
        data = sys.stdin.read(int(headers['len']))

        if (line.__contains__('PROCESS_STATE_STARTING')):
          data_params = dict([ x.split(':') for x in data.split()])
          if data_params['groupname'] == 'backend':
            write_stderr('\nBackend State: STARTING\n')
            shutil.copyfile(LOADING_TEMPLATE_PAGE, LOADING_PAGE_EDITOR)

        elif (line.__contains__('PROCESS_STATE_RUNNING')):
          data_params = dict([ x.split(':') for x in data.split()])
          if data_params['groupname'] == 'backend':
            write_stderr('\nBackend State: RUNNING\n')
            wait_until_backend_healthy(timeout=LOADING_PAGE_TIMEOUT_IN_SEC)
            write_stderr(data)

        elif (line.__contains__('PROCESS_STATE_FATAL')):
          data_params = dict([ x.split(':') for x in data.split()])
          if data_params['groupname'] == 'backend':
            write_stderr('\nBackend State: FATAL\n')
            remove_loading_page()

        # transition from READY to ACKNOWLEDGED
        write_stdout('RESULT 2\nOK')

if __name__ == '__main__':
    main()