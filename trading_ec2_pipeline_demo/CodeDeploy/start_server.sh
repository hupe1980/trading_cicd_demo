#!/bin/bash

status uwsgi | grep start
if [ "$?" == "0" ]
then
    restart uwsgi
fi

status uwsgi | grep stop
if [ "$?" == "0" ]
then
    start uwsgi
fi

service nginx start
