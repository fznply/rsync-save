rsync-save
======

rsync-save is an used to sync increment to remote Mac/Linux tools.
rsync-save depends on rsync and authorized ssh.

suitable scene
======
use atom editor coding in local Mac/Linux, build/run the project on remote Mac/Linux.

design mind
======
create a daemon process for monitoring the project dir.
catch the file changes event, call rsync or ssh command to sync the increment.

usage
======
1. create ".rsync_save.json" file in the project root dir, json content as bellow:

	```
    {
        "enable": true,
        "remoteHost": "remoteHost",
        "remotePath": "remotePath"
    }
    ```

2. make sure the local Mac/Linux can ssh remote Mac/Linux without password.

	```
	# In Local Mac/Linux
	cat ~/.ssh/config
	Host aliasRemoteHost
	  HostName 192.168.60.101
	  User root
	  Port 22
	```

3. it will automatically sync filesystem increment changes to the remote Mac/Linux.

faq
======
- [Incompatible native module](https://discuss.atom.io/t/incompatible-native-module/21454)
