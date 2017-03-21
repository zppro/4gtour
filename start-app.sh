#!/bin/sh
cd /桌面/git-repository/4gtour-repository/4gtour/src/
source $NVM_DIR/nvm.sh
nvm use 0.12.2
node --harmony app.js isProduction=true client.bulidtarget=vendor-1.x db.mongodb.user=4gtour db.mongodb.password=4gtour2016 db.mongodb.server=localhost db.mongodb.port=27017 db.mongodb.database=4gtour secure.authSecret=carrycheng port=3002
