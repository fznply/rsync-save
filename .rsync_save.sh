#!/bin/bash
cd `dirname $0`

src="./srcDir"
dst="loginUser@remoteServer:dstDir"
srcExclude=".rsync_save.sh"
dstExclude=""
rsync -avz --exclude $srcExclude --delete --exclude $dstExclude $src $dst

exit 0
