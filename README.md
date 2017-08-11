# rsync-save package
1. create .rsync_save.json into your project root dir, perhaps like bellow:

```
{
    "enable": true,
    "remoteHost":"remoteHost",
    "remotePath":"remotePath"
}
```

2. when file or dir changes, it automatically synchronizes to the remote.
