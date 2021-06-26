set -o errexit
set -o xtrace

UBUNTU_RELEASE="$(lsb_release -dc | awk '$1 == "Codename:" { print $2 }')"
echo "UBUNTU_RELEASE: $UBUNTU_RELEASE"
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" \
	| tee /etc/apt/sources.list.d/mongodb-org-4.4.list

add-apt-repository ppa:redislabs/redis

apt-get update -y

# Installing `gettext-base` just for `envsubst` command.
apt-get install -y maven gettext-base wget curl mongodb-org-{server,shell} redis nginx postgresql

service --status-all || true

mkdir -p /data/db  # TODO: Not sure if this is needed.
mkdir -p "$CODEBUILD_SRC_DIR/logs"
nohup mongod > "$CODEBUILD_SRC_DIR/logs/mongod.log" & disown $!
export APPSMITH_MONGODB_URI="mongodb://localhost:27017/appsmith"

which nginx
/etc/init.d/nginx reload

pg_ctlcluster 12 main start
su -c "psql --username=postgres --command=\"alter user postgres with password 'postgres'\"" postgres
pg_hba_file="$(pg_lsclusters --no-header | cut -d' ' -f6)"/pg_hba.conf
if [[ ! -f $pg_hba_file ]]; then
	echo "Missing pg_hba conf file at $pg_hba_file"
	pg_lsclusters --no-header | cat
	ls "$(pg_lsclusters --no-header | cut -d' ' -f6)"
	exit 3
fi
cat "$pg_hba_file"
content="$(sed 's/peer$/md5/' "$pg_hba_file")"
echo "$content" > "$pg_hba_file"
cat "$pg_hba_file"
pg_ctlcluster 12 main restart
PGPASSWORD=postgres psql --username=postgres --single-transaction --variable=ON_ERROR_STOP=ON --file="$CODEBUILD_SRC_DIR/app/client/cypress/init-pg-dump-for-test.sql"
PGPASSWORD=postgres psql --username=postgres --command="select * from public.configs"
PGPASSWORD=postgres psql --username=postgres --host=localhost --port=5432 --command="select * from public.configs"

export APPSMITH_REDIS_URL="redis://localhost:6379"
