#!/bin/bash

service nginx stop

status uwsgi | grep start
if [ "$?" == "0" ]
then
    stop uwsgi
fi