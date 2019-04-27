'use babel';

export default class RsyncSaveView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('rsync-save');

    // Create message element
    const message = document.createElement('div');
    message.textContent = 'The rsync-save current Working Detail: ';
    message.classList.add('message');
    this.element.appendChild(message);

    this.preBox = document.createElement('pre');
    this.element.appendChild(this.preBox);
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  setRsyncList(rsyncList) {
      var objInfo = {}
      objInfo['rsync_list'] = rsyncList;
      var strInfo = JSON.stringify(objInfo, null, 4);
      this.preBox.textContent = strInfo;
  }

}
