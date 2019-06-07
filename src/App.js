import React from 'react';

import './App.css';

import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentStatus: null,
      currentLine: null,
      totalLine: null,
      chats: [],
    };
  }
  render() {
    return (
      <div className="container">
        <div className="row mt-4">
          <div className="col col-12 offset-md-3 col-md-6">
            <div className="custom-file">
              <label htmlFor="select-file" className="custom-file-label">Select file...</label>
              <input id="select-file" className="custom-file-input" type="file" onChange={this.onChangeSelectFile} />
            </div>
          </div>
        </div>
        <div className="row mt-4">
          <div className="col col-12">
            {this.state.currentLine && this.state.totalLine
            ? (
            <pre>
              {this.state.currentLine} / {this.state.totalLine} = {_.round(this.state.currentLine / this.state.totalLine * 100, 2)}%
            </pre>
            ): null}
          </div>
        </div>
        <div className="row mt-4">
          <div className="col col-12">
            <pre>currentStatus: {JSON.stringify(this.state.currentStatus)}</pre>
            <pre>currentLine: {JSON.stringify(this.state.currentLine)}</pre>
            <pre>totalLine: {JSON.stringify(this.state.totalLine)}</pre>
            <pre>chats.length: {this.state.chats.length}</pre>
          </div>
        </div>
      </div>
    );
  }

  onChangeSelectFile = e => {
    const files = e.currentTarget.files;
    console.log('files:', files)

    const fileReader = new FileReader();
    $(fileReader).on('load', () => {
      this.setState({ currentStatus: 0 });
      console.log('FileReader.onload()')
      if (window.Worker) {
        const worker = new Worker('/worker.js');
        worker.onmessage = e => {
          console.log('Worker.onmessage()')
          if (e.data.type === 'status') {
            const { currentStatus } = e.data;
            this.setState({ currentStatus });
          } else if (e.data.type === 'log') {
            const { currentLine, totalLine } = e.data;
            this.setState({ currentLine, totalLine });
          } else if (e.data.type === 'data') {
            const { chats } = e.data;
            this.setState({ chats });
          }
        };
        worker.postMessage(fileReader.result);
      }
    });
    _.forEach(files, file => fileReader.readAsDataURL(file));
  }
}

export default App;
