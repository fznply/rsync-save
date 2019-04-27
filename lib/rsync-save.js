'use babel';

import RsyncSaveView from './rsync-save-view';
import { CompositeDisposable,File,BufferedNodeProcess } from 'atom';

export default {

    rsyncSaveView: null,
    modalPanel: null,
    subscriptions: null,
    debug: true,
    daemonProcessAll:{},
    projectRsyncData:{},

    config: {
        enableDebugFlag: {
            title: 'DebugFlag',
            type: 'boolean',
            default: true,
        }
    },

    activate(state) {
        this.rsyncSaveView = new RsyncSaveView(state.rsyncSaveViewState);
        this.modalPanel = atom.workspace.addModalPanel({
            item: this.rsyncSaveView.getElement(),
            visible: false
        });

        var flag = atom.config.get('rsync-save.enableDebugFlag');
        if (false == flag) {
            this.debug = false;
        } else {
            this.debug = true;
        }

        var instance = this;
        atom.config.onDidChange('rsync-save.enableDebugFlag', 'rsync-save', function(event) {
            if (false == event.newValue) {
                instance.debug = false;
            } else {
                instance.debug = true;
            }
        });

        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.subscriptions = new CompositeDisposable();

        // Register command that toggles this view
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'rsync-save:toggle': () => this.toggle(),
        }));

        const projectPaths = atom.project.getPaths();
        projectPaths.forEach((projectPath, index) => {
            instance.checkProject(projectPath);
        });

        atom.project.onDidChangePaths(function(xProjectPaths) {
            var oldProjectPaths = {}
            for (var projectPath in instance.projectRsyncData) {
                oldProjectPaths[projectPath] = true;
            }
            for (var projectPath of xProjectPaths) {
                if (projectPath in oldProjectPaths) {
                    delete oldProjectPaths[projectPath];
                }
                instance.checkProject(projectPath);
            }
            for (var projectPath in oldProjectPaths) {
                if (projectPath in instance.projectRsyncData) {
                    instance.logInfo(`${projectPath} Remove`);
                    var oldRsyncData = instance.projectRsyncData[projectPath];
                    for (var delRsync in oldRsyncData) {
                        instance.killRsyncSave(delRsync);
                    }
                    delete instance.projectRsyncData[projectPath];
                }
            }
        });

        atom.workspace.observeTextEditors (function(editor) {
            editor.onDidSave(function() {
                var filePath = editor.getPath();
                if (editor.getTitle() == ".rsync_save.json") {
                    var end = filePath.lastIndexOf("/")
                    if (end > 0) {
                        var projectPath = filePath.substring(0, end);
                        instance.checkProject(projectPath);
                    }
                }
                console.log(filePath + " onDidSave");
            });
        });
    },

    deactivate() {
        var uKeyList = [];
        for (var uKey in this.daemonProcessAll) {
            uKeyList.push(uKey);
        }
        for(var uKey of uKeyList) {
            this.killRsyncSave(uKey);
        }

        this.modalPanel.destroy();
        this.subscriptions.dispose();
        this.rsyncSaveView.destroy();
    },

    serialize() {
        return {
            rsyncSaveViewState: this.rsyncSaveView.serialize()
        };
    },

    toggle() {
        console.log('RsyncSave was toggled!');
        var rsyncList = []
        for(var uKey in this.daemonProcessAll) {
            rsyncList.push(uKey);
        }
        this.rsyncSaveView.setRsyncList(rsyncList);

        return (
            this.modalPanel.isVisible() ?
            this.modalPanel.hide() :
            this.modalPanel.show()
        );
    },

    checkProject(xProjectPath) {
        var projectPath = xProjectPath;
        if (xProjectPath.endsWith("/")) {
            projectPath = xProjectPath.substring(0, xProjectPath.length - 1);
        }

        var confPath = projectPath + "/.rsync_save.json";
        var file = new File(confPath);
        if (!file.existsSync()) {
            this.logInfo(`${projectPath} IGNORED`);
            return;
        } else {
            this.logInfo(`${projectPath} RECHECK`);
        }

        var instance = this;
        file.read(false).then((text) => {
            console.log(`confPath ${confPath} text ${text}`);
            try {
                var retParse = JSON.parse(text);
                if (instance.isObj(retParse)) {
                    var confObjList = [retParse];
                } else if(instance.isArr(retParse)) {
                    var confObjList = retParse;
                } else {
                    var msg = `illegal conf ${confPath}`;
                    instance.logError(msg);
                    return;
                }
                if (!(projectPath in instance.projectRsyncData)) {
                    instance.projectRsyncData[projectPath] = {}
                }
                var oldRsyncData = instance.projectRsyncData[projectPath];

                var newRsyncData = {}
                var newRsyncList = []
                for (var confObj of confObjList) {
                    var checkedConf = instance.checkConfObj(projectPath, confObj);
                    if (!instance.isArr(checkedConf)) {
                        return;
                    } else if (checkedConf.length < 1) {
                        continue;
                    }

                    var uKey = instance.uKeyGen(checkedConf);
                    if (!(uKey in oldRsyncData)) {
                        instance.execRsyncSave(checkedConf, uKey);
                    }
                    newRsyncList.push(uKey);
                }

                for (var newRsync of newRsyncList) {
                    newRsyncData[newRsync] = true;
                    if (newRsync in oldRsyncData) {
                        this.logInfo(`${newRsync} WORKING`);
                        delete oldRsyncData[newRsync];
                    }
                }

                instance.projectRsyncData[projectPath] = newRsyncData;
                for (var delRsync in oldRsyncData) {
                    instance.killRsyncSave(delRsync);
                }
            } catch(e) {
                instance.logError(`with ${confPath} error:` + e);
            }
        });
    },

    checkConfObj(projectPath, confObj) {
        if (!this.isObj(confObj)) {
            var msg = `illegal conf ${confPath}`;
            this.logError(msg);
            return false;
        }

        var lPath = '';
        if (confObj["localPath"]) {
            var lPath = confObj["localPath"];
        }
        if (!lPath.startsWith("/")) {
            lPath = projectPath + '/' + lPath;
        }
        if (lPath.endsWith("/")) {
            lPath = lPath.substring(0, lPath.length - 1);
        }

        if (!confObj["enable"]) {
            var msg = `ignore ${lPath}`;
            this.logInfo(msg);
            return [];
        }
        if (!confObj["remoteHost"] || !confObj["remotePath"]) {
            var msg = `missing field remoteHost or remotePath`;
            this.logError(msg);
            return [];
        }

        var remote = confObj["remoteHost"];
        var rPath = confObj["remotePath"];
        checkedConf = [lPath, remote, rPath];
        return checkedConf;
    },

    createOnErrorFunc() {
        return (nodeError) => {
            this.logError('DaemonProcess error: ' + nodeError);
        };
    },

    killRsyncSave(uKey) {
        if (uKey in this.daemonProcessAll) {
            var daemonProcess = this.daemonProcessAll[uKey];
            this.logInfo(`${uKey} STOPPING`);
            daemonProcess.kill();
            delete this.daemonProcessAll[uKey];
        }
    },

    execRsyncSave(checkedConf, uKey) {
        const stdout = (output) => {
            if (this.debug) {
                console.log(output);
            }
        }

        const stderr = (output) => {
            console.error(output);
        }

        const exit = (code) => {
            var msg = "DaemonProcess exit with code " + code;
            if (0 != code) {
                this.logError(msg);
            } else if (this.debug) {
                this.logSuccess(msg);
            }
        }

        var command = __dirname + "/RsyncSaveDaemon.js";
        var args = checkedConf;
        var cwd = checkedConf[0];
        var options = {cwd};

        if (uKey in this.daemonProcessAll) {
            this.logInfo(`${uKey} REPEATED`);
            return;
        } else {
            this.logInfo(`${uKey} STARTING`);
        }

        var bnpArgs = {command, args, options, stdout, exit, stderr};
        var daemonProcess = new BufferedNodeProcess(bnpArgs);
        daemonProcess.onWillThrowError(this.createOnErrorFunc());
        this.daemonProcessAll[uKey] = daemonProcess
    },

    uKeyGen (checkedConf) {
        var uKey = checkedConf.join('#')
        return uKey;
    },

    logInfo (msg) {
        var xMsg = "rsync-save: " + msg;
        if (this.debug) {
            atom.notifications.addInfo(xMsg);
            console.log(xMsg);
        } else {
            console.log(xMsg);
        }
    },

    logError (msg) {
        var xMsg = "rsync-save: " + msg;
        atom.notifications.addError(xMsg);
        console.error(xMsg);
    },

    logSuccess(msg) {
        var xMsg = "rsync-save: " + msg;
        atom.notifications.addSuccess(xMsg);
        console.log(xMsg);
    },

    isObj (value) {
        return value && typeof value === 'object' && value.constructor === Object;
    },

    isArr (value) {
        return value && typeof value === 'object' && value.constructor === Array;
    }

};
