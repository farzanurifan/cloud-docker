REDISSERVERCONTAINER=xredis_server
POOL=$(sudo docker inspect $(sudo docker-compose ps -q app) -f '{{.NetworkSettings.Networks.clouddocker_default.IPAddress}}:3000')
i=1
for rc in $POOL
do
	echo $rc
	cmd="set upstreamhost_$i $rc"
	sudo docker exec -ti xredis_server redis-cli -h xredis_server $cmd
	i=$((i+1))
done
sudo docker exec -ti xbalancer sh /tmp/update_upstream.sh
sudo docker-compose restart reverseproxy
