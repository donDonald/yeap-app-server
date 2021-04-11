#!/bin/bash

PORT=$1
NAME=$2
echo "About to register a user, name $NAME"
echo "const access_token = {id:'$NAME', displayName:'$NAME', thumbnail:'$NAME.png'};" > ./.register.js
echo "const str = JSON.stringify(access_token);" >> .register.js
echo "const url = 'curl -k -d \"did=&ap=bogus-token&access_token='+encodeURIComponent(str)+'\" -X POST https://localhost:$PORT/api/auth/register';" >> .register.js
echo "console.log(url);" >> .register.js
node ./.register.js | bash

