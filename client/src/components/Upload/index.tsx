import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  noop,
  uuid,
  isFuntion,
  transformStringSizeToNumberSize,
  md5,
  getBase64
} from './util';

const inputFileId = uuid()

export interface IUpload {
  fileList?: IFile[];
  accept?: string;
  action?: string;
  drag?: boolean;
  multiple?: boolean;
  directory?: boolean;
  headers?: object;
  onChange?: (fileList: File[]) => void,
  onEnter?: (file: File) => Promise<any>;
  onSuccess?: () => void;
  onError?: () => void;
  onOverflowFileListMaximumLength?: (count: number) => void;
  onOverflowFileMaximumSize?: (file: File) => void;
  concurrency?: number;
  MAXSIZE?: number;
  MAXLENGTH?: number;
  breakpointResume?: boolean;
  largeFile?: boolean;
  chunkSize?: boolean;
  scheduler?: () => void;
}

enum Status {
  Uploading,
  Done,
  Error
}

export interface IFile {
  file: File;
  uid: string;
  size: number;
  name: string;
  status: Status;
  response: JSON | null;
  progress: number;
}

const Upload: React.FC<IUpload> = (props) => {

  const {
    fileList = [],
    accept = 'image/*,.doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    action = '',
    drag = false,
    multiple = false,
    directory = false, // TODO: directory
    headers = {},
    onChange = noop,
    onEnter = noop,
    onSuccess = noop,
    onError = noop,
    onOverflowFileListMaximumLength = noop,
    onOverflowFileMaximumSize = noop,
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
  const queue: IFile[] = [];
  const uploadingQueue: IFile[] = [];

  const handleFileChange = () => {
    let files = ((inputFileEl.current as unknown) as HTMLInputElement).files;
    if (files) {
      const total = files.length + fileList.length;
      if (!MAXLENGTH && total > MAXLENGTH) {
        onOverflowFileListMaximumLength && onOverflowFileListMaximumLength(total);
      } else {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const size = file.size;
          const name = file.name;
          if (size > MAXSIZE) {
            onOverflowFileMaximumSize && onOverflowFileMaximumSize(file);
          } else {
            queueJob({
              file,
              uid: uuid(),
              size,
              name,
              status: Status.Uploading,
              response: null,
              progress: 0
            })
          }
        }
      }
    }
  }

  const queueJob = (job: IFile) => {
    queue.push(job);
    flushJobs();
  }

  const flushJobs = () => {
    if (uploadingQueue.length < concurrency && queue.length > 0) {
      const uploadFile = queue.shift() as IFile;
      if (isFuntion(onEnter) && onEnter(uploadFile.file)) {
        uploadingQueue.push(uploadFile);
        submit();
      }
    }
  }

  const submit = () => {
  }
  
  // Slicing files
  const fragmentation = () => {
  }

  return (
    <label
      htmlFor={inputFileId}
    >
      <input
        onChange={handleFileChange}
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
