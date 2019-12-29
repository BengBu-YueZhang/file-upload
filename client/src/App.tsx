import React from 'react';
import './App.css';
import Upload from './components/Upload';
import Button from '@material-ui/core/Button';

const App: React.FC = () => {
  return (
    <div className="App">
      <Upload>
        <span>upload</span>
      </Upload>
    </div>
  );
}

export default App;
