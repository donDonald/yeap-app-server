#!/usr/bin/env bash
set -e -u -o pipefail

# To get it working:
#     sudo apt update && sudo apt install jq
#     sudo ./docker-hosts-update.sh
#
# https://stackoverflow.com/questions/37242217/access-docker-container-from-host-using-containers-name

hosts_file=/etc/hosts
begin_block="# BEGIN DOCKER CONTAINERS"
end_block="# END DOCKER CONTAINERS"

if ! grep -Fxq "$begin_block" "$hosts_file"; then
    echo -e "\n${begin_block}\n${end_block}\n" >> "$hosts_file"
fi

(echo "| container start |" && docker events) | \
while read event; do
    if [[ "$event" == *" container start "* ]] || [[ "$event" == *" network disconnect "* ]]; then
        hosts_file_tmp="$(mktemp)"
        docker container ls -q | xargs -r docker container inspect | \
        #jq -r '.[]|"\(.NetworkSettings.Networks[].IPAddress|select(length > 0) // "# no ip address:") \(.Name|sub("^/"; "")|sub("_1$"; ""))"' | \
        jq -r '.[]|"\(.NetworkSettings.Networks[].IPAddress|select(length > 0) // "# no ip address:") \(.Name|sub("^/[a-zA-Z0-9]*_"; "")|sub("_1$"; ""))"' | \
        sed -ne "/^${begin_block}$/ {p; r /dev/stdin" -e ":a; n; /^${end_block}$/ {p; b}; ba}; p" "$hosts_file" \
        > "$hosts_file_tmp"
        chmod 644 "$hosts_file_tmp"
        mv "$hosts_file_tmp" "$hosts_file"
    fi
done

