rsync-save
======
1. automatically sync file changes to the remote Mac/Linux.
2. it depends on rsync and authorized ssh.
3. current version 1.0.0:
    a. observe multi localPath
    b. toggle show working state.

suitable scene
======
use atom editor coding in local Mac/Linux, build/run the project on remote Mac/Linux.

design mind
======
1. create a daemon process to observe the specify localPath.
2. observe file changes event, rsync the increment to the remote Mac/Linux.

usage
======
1. create ".rsync_save.json" file in the project root dir, json content as bellow:
    ```
    example 1: observe current dir.
    {
        "enable": true,
        "remoteHost": "remoteHost",
        "remotePath": "remotePath"
    }
    ```

    ```
    example 2: observe multi localPath.
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

3. it will automatically sync file changes to the remote Mac/Linux.

faq
======
- [Incompatible native module](https://discuss.atom.io/t/incompatible-native-module/21454)
