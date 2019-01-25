#!/bin/bash

# install python requirements
pip-3.6 install -r /webapps/app/FlaskApp/requirements.txt

# get/set vars
export DATABASE_ROOT_USER=root
export DATABASE_ROOT_PASSWORD=$(aws ssm get-parameter --name TEST-DATABASE-MASTER-PASSWORD --with-decryption --query 'Parameter.Value' --output text)
export DATABASE_PASSWORD=$(aws ssm get-parameter --name TEST-DATABASE-WEB-USER-PASSWORD --with-decryption --query 'Parameter.Value' --output text)
export DATABASE_HOST=$(aws cloudformation describe-stacks --query 'Stacks[?contains(StackId,`TEST-Stack`)]|[0].Outputs[?contains(OutputKey,`RDSAddress`)]|[].OutputValue' --output text)
export DATABASE_DB_NAME=TEST-airports
export DATABASE_USER=web_user

# setup sql database
cat /webapps/app/CodeDeploy/TEST-CreateDrop.sql | mysql -h $DATABASE_HOST -u $DATABASE_ROOT_USER -p$DATABASE_ROOT_PASSWORD
sed "s/SED_REPLACE_PASS/$DATABASE_PASSWORD/g" < /webapps/app/CodeDeploy/create_schema.sql | mysql -h $DATABASE_HOST -u $DATABASE_ROOT_USER -p$DATABASE_ROOT_PASSWORD $DATABASE_DB_NAME
/webapps/app/CodeDeploy/database_populate.py

# copy in the nginx config
mv -f /webapps/app/CodeDeploy/nginx.conf /etc/nginx/nginx.conf
service nginx restart

# push configuration into app.ini
sed -i s/SED_REPLACE_DATABASE_HOST/$DATABASE_HOST/g /webapps/app/CodeDeploy/app.ini
sed -i s/SED_REPLACE_DATABASE_DB_NAME/$DATABASE_DB_NAME/g /webapps/app/CodeDeploy/app.ini
echo "env = ENV_PREFIX=TEST-" >> /webapps/app/CodeDeploy/app.ini

# configure region for the app
EC2_AVAIL_ZONE=`curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone`
EC2_REGION="`echo \"$EC2_AVAIL_ZONE\" | sed -e 's:\([0-9][0-9]*\)[a-z]*\$:\\1:'`"
echo "env = AWS_DEFAULT_REGION=$EC2_REGION" >> /webapps/app/CodeDeploy/app.ini

# display the deployment group in the footer
echo $DEPLOYMENT_GROUP_NAME > /webapps/app/FlaskApp/templates/buildinfo.html

# configure upstart to run uwsgi
mv -f /webapps/app/CodeDeploy/uwsgi.conf /etc/init/uwsgi.conf
mv -f /webapps/app/CodeDeploy/app.ini /webapps/app/FlaskApp/
