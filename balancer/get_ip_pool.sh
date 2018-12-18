docker inspect $(docker-compose ps -q) -f 'server {{.NetworkSettings.Networks.personservice_default.IPAddress}}:5000;'
