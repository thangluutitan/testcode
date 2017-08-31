dbname="frogchatv1"
mongo_username="staff"
mongo_password="staff"
mongo_host="localhost"
mongo_port="27017"
is_authen=0

if [[ ${MONGOV1_USERNAME} && ${MONGOV1_PASSWORD} ]]; then
	dbname=${MONGOV1_DBNAME}
	mongo_username=${MONGOV1_USERNAME}
	mongo_password=${MONGOV1_PASSWORD}
	mongo_host=${MONGOV1_HOST}
	mongo_port=${MONGOV1_PORT}
	is_authen=1
else
  dbname="frogchatv1"
fi

if [[ $is_authen -eq 1 ]]; then
	for table in group group_category  favourites message message_status user user_block user_contact user_group
	do
		mongoimport --host ${mongo_host} --port ${mongo_port} --username ${mongo_username} --password ${mongo_password} -d ${dbname} -c $table --type=csv --headerline --drop ./DataV1/$table.csv
	done
else 
	for table in group group_category  favourites message message_status user user_block user_contact user_group
	do
		mongoimport -d ${dbname} -c $table --type=csv --headerline --drop ./DataV1/$table.csv
	done
fi


