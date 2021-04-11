#!/bin/bash

PORT=$1
DID=$2
UIDDD=$3
echo "About to logout, DID:$DID, UID:$UIDDD"
echo "const url = 'curl -k -d \"did=$DID&uid=$UIDDD\" -X POST https://localhost:$PORT/api/auth/logout';               " > .logout.js
echo "console.log(url);" >> .logout.js
node ./.logout.js | bash

