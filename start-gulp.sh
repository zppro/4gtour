#!/bin/sh
cd ~/github/4gtour/

if [ $1 == "vendor-1.x" ]
    then
        echo 'target='${1}
    else
        echo 'invalid target!!'
        exit
fi

gulp --target=$1 --level=$2
