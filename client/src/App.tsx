import React from 'react';
import './App.css';
import Upload from './components/Upload';
import { Button } from 'antd';

const App: React.FC = () => {
  return (
    <div className="App">
      <Upload
        mergeAction={'http://localhost:7788/upload/merge'}
        action={'http://localhost:7788/upload'}
        large={true}
      >
        上传
      </Upload>
    </div>
  );
};

export default App;
