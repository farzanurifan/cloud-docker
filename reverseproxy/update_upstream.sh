KEYS=$(echo "keys upstream*" | redis-cli --raw -h redis)
echo "" > /tmp/upstream.conf
echo "upstream docker-nginx {" >> /tmp/upstream.conf
for R in $KEYS
do
   LINE=$(echo "get $R" | redis-cli --raw -h redis )
   echo "server $LINE;" >> /tmp/upstream.conf
done
echo "}" >> /tmp/upstream.conf

