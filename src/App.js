import React from 'react';
import './App.css';

function App() {
  return (
    <div className="container">
      <div className="row mt-4">
        <div className="col col-12 offset-md-3 col-md-6">
          <div className="custom-file">
            <label htmlFor="select-file" className="custom-file-label">Select file...</label>
            <input id="select-file" className="custom-file-input" type="file" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
