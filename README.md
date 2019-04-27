rsync-save
======

rsync-save is an used to sync increment to remote Mac/Linux tools.
rsync-save depends on rsync and authorized ssh.

current version 0.9.9: support multi localPath, toggle show working state.

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
    example 1: localPath is null, means the current dir
    {
        "enable": true,
        "remoteHost": "remoteHost",
        "remotePath": "remotePath"
    }
    ```

    ```
    example 2. support multi localPath
    [{
        "enable": true,
        "localPath": "path/to/dir1",
        "remoteHost": "remoteHost1",
        "remotePath": "/path/to/remote/dir1"
    },{
        "enable": true,
        "localPath": "path/to/dir2",
        "remoteHost": "remoteHost2",
        "remotePath": "/path/to/remote/dir2"
    }]
    ```

2. make sure the local Mac/Linux can ssh remote Mac/Linux without password.

    ```
    # In Local Mac/Linux
    cat ~/.ssh/config
    Host remoteHost1
        HostName 192.168.60.101
        User root
        Port 22
    Host remoteHost2
        HostName 192.168.60.102
        User root
        Port 22
    ```

3. it will automatically sync filesystem increment changes to the remote Mac/Linux.

faq
======
- [Incompatible native module](https://discuss.atom.io/t/incompatible-native-module/21454)
