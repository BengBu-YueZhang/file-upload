import React from 'react';
import './App.css';
import Upload from './components/Upload';
import { Button } from 'antd';

const App: React.FC = () => {
  return (
    <div className="App">
      <Upload>
        <span>上传</span>
      </Upload>
    </div>
  );
};

export default App;
