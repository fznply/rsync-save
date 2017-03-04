'use babel';

import RsyncSaveView from './rsync-save-view';
import { CompositeDisposable,BufferedProcess } from 'atom';

export default {

  rsyncSaveView: null,
  modalPanel: null,
  subscriptions: null,
  debug: true,

  config: {
    enableFlag: {
      title: 'Flag',
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

    var flag = atom.config.get('rsync-save.enableFlag');
    if (false == flag) {
        this.debug = false;
    } else {
        this.debug = true;
    }

    var instance = this;
    atom.config.onDidChange('rsync-save.enableFlag', 'rsync-save', function(event) {
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

    atom.workspace.observeTextEditors (function(editor) {
        editor.onDidSave(function() {
            instance.execRsyncSave();
        });
    });

  },

  deactivate() {
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
    return;

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

  execRsyncSave() {

      const path = atom.project.getPaths();
      var rsync_script = path + "/.rsync_save.sh";
      if (this.debug) {
          console.log("exec rsync_script : " + rsync_script);
      }

      const command = '/bin/bash'
      const args = [rsync_script]
      const stdout = (output) => {
          if (this.debug) {
              console.log(output);
          }
      }
      const stderr = (output) => {
          console.error(output);
      }
      const exit = (code) => {
          var message = "/bin/bash '" + rsync_script + "' exited with " + code;
          if(0 != code) {
              atom.notifications.addError(message);
              console.error(message);
          } else if (this.debug) {
              atom.notifications.addSuccess(message);
              console.log(message);
          }
      }
      const process = new BufferedProcess({command, args, stdout, exit, stderr})
      process.onWillThrowError(this.createOnErrorFunc());
  }

};
