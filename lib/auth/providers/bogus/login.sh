#!/bin/bash

PORT=$1
DID=$2
CAT=$3
echo "About to login, DID:$DID, CAT:$CAT"
echo "const url = 'curl -k -d \"did=$DID&cat=$CAT\" -X POST https://localhost:$PORT/api/auth/login';               " > .login.js
echo "console.log(url);" >> .login.js
node ./.login.js | bash

