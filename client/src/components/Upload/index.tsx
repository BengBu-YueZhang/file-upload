import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  noop,
  noopEnter,
  uuid,
  transformStringSizeToNumberSize,
  md5,
  getBase64
} from './util';

const inputFileId = uuid()

export interface IUpload {
  accept?: string;
  action?: string;
  drag?: boolean;
  multiple?: boolean;
  directory?: boolean;
  headers?: object;
  onEnter?: () => Promise<any>;
  onSuccess?: () => void;
  onError?: () => void;
  concurrency?: number;
  MAXSIZE?: number;
  MAXLENGTH?: number;
  breakpointResume?: boolean;
  largeFile?: boolean;
  chunkSize?: boolean;
  scheduler?: () => void
}

const Upload: React.FC<IUpload> = (props) => {

  const {
    accept = 'image/*,.doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    action = '',
    drag = false,
    multiple = false,
    directory = false, // TODO: directory
    headers = {},
    onEnter = noopEnter,
    onSuccess = noop,
    onError = noop,
    concurrency = 4,
    MAXSIZE = 10 * 1024 * 1024,
    MAXLENGTH = 0,
    breakpointResume = false,
    largeFile = false,
    chunkSize = 2 * 1024 * 1024,
    scheduler = axios,
    children
  } = props

  const inputFileEl = useRef(null);
  const [queue, setQueue] = useState([]);
  const [uploadQueue, setUploadQueue] = useState([]);

  const handleFileChange = () => {
  }

  const queueJob = () => {
  }

  const flushJobs = () => {
  }

  const submit = () => {
  }

  const fragmentation = () => {
  }

  return (
    <label
      htmlFor={inputFileId}
    >
      <input
        ref={inputFileEl}
        id={inputFileId}
        type="file"
        accept={accept}
        style={{display: 'none'}}
        multiple={multiple}
      />
      {
        children
      }
    </label>
  )
}

export default Upload;
