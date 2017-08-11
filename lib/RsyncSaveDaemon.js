var chokidar = require('chokidar');
var child_process = require('child_process');
var path_lib = require('path');

function execIncrSync(lPath, remote, rPath) {
    var log = console.log.bind(console);
    var error = console.error.bind(console);

    log(`lPath=${lPath} remote=${remote} rPath=${rPath}`);

    var lRoot = lPath.replace(/\/$/g, "");
    var rRoot = rPath.replace(/\/$/g, "");

    var watcher = chokidar.watch(lRoot, {
        //ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true
    });

    watcher
    .on('add', path => {
        path = path.substr(lRoot.length+1);
        if(-1 == path.indexOf("'") && -1 == path.indexOf('"')) {
            var dir = path_lib.dirname(path) + "/";
            if ("./" == dir) {
                dir = "";
            }
            var log_str = `rsync ${path} ${remote}:${rRoot}/${dir}`;
            var res = child_process.spawnSync('rsync', [`${path}`, `${remote}:${rRoot}/${dir}`]);
            var code = res.status;
            log(`${log_str} exit with code ` + code);
        } else {
            error(`${path} illegal`);
        }
    })
    .on('change', path => {
        path = path.substr(lRoot.length+1);
        if(-1 == path.indexOf("'") && -1 == path.indexOf('"')) {
            var dir = path_lib.dirname(path) + "/";
            if ("./" == dir) {
                dir = "";
            }
            var log_str = `rsync ${path} ${remote}:${rRoot}/${dir}`;
            var res = child_process.spawnSync('rsync', [`${path}`, `${remote}:${rRoot}/${dir}`]);
            var code = res.status;
            log(`${log_str} exit with code ` + code);
        } else {
            error(`${path} illegal`);
        }
    })
    .on('unlink', path => {
        path = path.substr(lRoot.length+1);
        if(-1 == path.indexOf("'") && -1 == path.indexOf('"')) {
            var log_str = `ssh ${remote} "rm -rf '${rRoot}/${path}'"`;
            var res = child_process.spawnSync('ssh', [`${remote}`, `rm -rf '${rRoot}/${path}'`]);
            var code = res.status;
            log(`${log_str} exit with code ` + code);
        } else {
            error(`${path} illegal`);
        }
    });

    watcher
    .on('addDir', path => {
        path = path.substr(lRoot.length+1);
        if(-1 == path.indexOf("'") && -1 == path.indexOf('"')) {
            var log_str = `ssh ${remote} "mkdir -p '${rRoot}/${path}'"`;
            var res = child_process.spawnSync('ssh', [`${remote}`, `mkdir -p '${rRoot}/${path}'`]);
            var code = res.status;
            log(`${log_str} exit with code ` + code);
        } else {
            error(`${path} illegal`);
        }
    })
    .on('unlinkDir', path => {
        path = path.substr(lRoot.length+1);
        if(-1 == path.indexOf("'") && -1 == path.indexOf('"')) {
            var log_str = `ssh ${remote} "rm -rf '${rRoot}/${path}'"`;
            var res = child_process.spawnSync('ssh', [`${remote}`, `rm -rf '${rRoot}/${path}'`]);
            var code = res.status;
            log(`${log_str} exit with code ` + code);
        } else {
            error(`${path} illegal`);
        }
    });
}

execIncrSync(process.argv[2], process.argv[3], process.argv[4]);
