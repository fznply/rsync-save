#!/bin/bash
src="srcDir"
dst="loginUser@remoteServer:dstDir"
srcExclude=""
dstExclude=""
rsync -avz --exclude $srcExclude --delete --exclude $dstExclude $src $dst
exit 0
