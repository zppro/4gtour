#!/bin/sh
cd src
source $NVM_DIR/nvm.sh
nvm use 0.12.2
node --harmony app.js isProduction=false client.bulidtarget=vendor-1.x db.mongodb.user=4gtour db.mongodb.password=4gtour2016 db.mongodb.server=localhost db.mongodb.port=27017 db.mongodb.database=4gtour secure.authSecret=carrycheng port=3002
