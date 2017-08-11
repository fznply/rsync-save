'use babel';

import RsyncSaveView from './rsync-save-view';
import { CompositeDisposable,File,BufferedNodeProcess } from 'atom';

export default {

    rsyncSaveView: null,
    modalPanel: null,
    subscriptions: null,
    debug: true,
    daemonProcessArr:[],

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
            var confPath = projectPath+"/.rsync_save.json";
            var file = new File(confPath);
            if (!file.exists() || !file.isFile()) {
                return;
            }

            file.read(false).then((text) => {
                console.log(`confPath ${confPath} text ${text}`);
                try {
                    var confObj = JSON.parse(text);
                    if (!confObj["remoteHost"] || !confObj["remotePath"]) {
                        return;
                    }
                    if (!confObj["enable"]) {
                        return;
                    }

                    var remote = confObj["remoteHost"];
                    var rPath = confObj["remotePath"];
                    instance.execRsyncSave(index, projectPath, remote, rPath);

                } catch(e) {
                    console.error("json.parse failed " + e);
                }
            });
        });

        atom.workspace.observeTextEditors (function(editor) {
            editor.onDidSave(function() {
                console.log("editor.onDidSave");
            });
        });

    },

    deactivate() {
        this.daemonProcessArr.forEach((daemonProcess, index) => {
            console.log(`DaemonProcess ${index} stop`);
            daemonProcess.kill();
        });

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
        return (
            this.modalPanel.isVisible() ?
            this.modalPanel.hide() :
            this.modalPanel.show()
        );
    },

    createOnErrorFunc() {
        return (nodeError) => {
            console.log(nodeError);
        };
    },

    execRsyncSave(index, projectPath, remote, rPath) {

        const stdout = (output) => {
            if (this.debug) {
                console.log(output);
            }
        }

        const stderr = (output) => {
            console.error(output);
        }

        const exit = (code) => {
            var message = "daemonProcess exit with code " + code;
            if(0 != code) {
                atom.notifications.addError(message);
                console.error(message);
            } else if (this.debug) {
                atom.notifications.addSuccess(message);
                console.log(message);
            }
        }

        var command = __dirname + "/RsyncSaveDaemon.js";
        var args = [projectPath, remote, rPath];
        var cwd = projectPath;
        var options = {cwd};

        var daemonProcess = new BufferedNodeProcess({command, args, options, stdout, exit, stderr});
        daemonProcess.onWillThrowError(this.createOnErrorFunc());

        console.log(`DaemonProcess ${index} start`);
        this.daemonProcessArr.push(daemonProcess);
    }

};
