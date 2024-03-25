import atexit
import logging
import os
import os.path
import subprocess
import time
import urllib.error
import urllib.request


LOADING_PAGE_EDITOR = os.getenv("WWW_PATH") + '/loading.html'
BACKEND_HEALTH_ENDPOINT = "http://localhost:8080/api/v1/health"
LOG_FILE = os.path.join(os.getenv("APPSMITH_LOG_DIR"), "backend", "starting_page_init.log")
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s -  %(message)s'

logging.basicConfig(filename = LOG_FILE, level = logging.NOTSET, format = LOG_FORMAT)


def get_backend_status():
    try:
        return subprocess.getoutput("supervisorctl status backend").split()[1]
    except subprocess.CalledProcessError as e:
        logging.error("Subprocess Error ", e)
    except ValueError as e:
        logging.error("Value Error ", e)

def check_health_endpoint(url,sleep_sec = 3,timeout_sec = 180):
    for _ in range(timeout_sec//sleep_sec):
        try:
            with urllib.request.urlopen(url) as response:
                if response.status == 200:
                    logging.info('Backend health check successful.')
                    break
        except urllib.error.URLError:
            pass # retry after sleep_sec
        finally:
            time.sleep(sleep_sec)
            if get_backend_status() in ('FATAL' , 'BACKOFF'):
                break
    else:
        logging.error('Timeout Error: Backend health check timeout.')

def remove_loading_page():
    retries = 3
    for _ in range(retries):
        try:
            if os.path.exists(LOADING_PAGE_EDITOR):
                os.remove(LOADING_PAGE_EDITOR)
            break
        except OSError as e:
            logging.error("Failed to remove loading page ", e)
        time.sleep(1)
    else:
        logging.error("Loading page removal failed after %i retries. Trying again one final time.", retries)
        logging.info(subprocess.getoutput("rm -fv " + LOADING_PAGE_EDITOR))


@atexit.register
def failsafe():
    remove_loading_page()

def main():
    check_health_endpoint(BACKEND_HEALTH_ENDPOINT)
    remove_loading_page()

if __name__ == '__main__':
    main()
