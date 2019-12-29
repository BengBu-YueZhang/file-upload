import React from 'react';
import './App.css';
import Upload from './components/Upload';
import Button from '@material-ui/core/Button';

const App: React.FC = () => {
  return (
    <div className="App">
      <Upload>
        <Button variant="contained" color="primary">Upload</Button>
      </Upload>
    </div>
  );
}

export default App;
