import React, { useState, useRef, useMemo } from 'react';
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
  method: 'get' | 'post';
  fileList?: IFile[];
  accept?: string;
  action?: string;
  drag?: boolean;
  multiple?: boolean;
  directory?: boolean;
  headers?: object;
  onChange?: (fileList: IFile[]) => void,
  onEnter?: (file: File) => Promise<any>;
  onSuccess?: () => void;
  onError?: () => void;
  onOverflowFileListMaximumLength?: (count: number) => void;
  onOverflowFileMaximumSize?: (file: File) => void;
  concurrency?: number;
  chunkConcurrency?: number;
  MAXSIZE?: number;
  MAXLENGTH?: number;
  breakpointResume?: boolean;
  largeFile?: boolean;
  chunkSize?: number;
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

export interface IChunk {
  blob: Blob;
  index: string;
  md5: string;
}

const Upload: React.FC<IUpload> = (props) => {

  const {
    method = 'post',
    fileList = [],
    accept = 'image/*,.doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    action = '',
    drag = false,
    directory = false, // TODO: TS中暂不支持该属性
    headers = {},
    concurrency = 4,
    chunkConcurrency = 8,
    onChange = noop,
    onEnter = noop,
    onSuccess = noop,
    onError = noop,
    onOverflowFileListMaximumLength = noop,
    onOverflowFileMaximumSize = noop,
    MAXSIZE = 10 * 1024 * 1024,
    MAXLENGTH = 0,
    breakpointResume = false,
    largeFile = false,
    chunkSize = 2 * 1024 * 1024,
    children
  } = props

  const inputFileEl = useRef(null);
  const isLargeFile = useMemo(() => {
    return largeFile || breakpointResume
  }, [largeFile, breakpointResume])
  const list: IFile[] = [];
  const queue: IFile[] = [];
  const uploadingQueue: IFile[] = [];
  const uploadingChunkQueue: IChunk[] = [];
  const chunks: IChunk[] = [];

  let { multiple = false } = props

  if (isLargeFile && multiple) {
    // 大文件上传，只支持单文件上传
    multiple = false
  }

  const applyOnChange = () => {
    onChange && onChange(list);
  }

  const handleNormalFileChange = (files: FileList) => {
    const total = files.length + fileList.length;
    if (!MAXLENGTH && total > MAXLENGTH) {
      onOverflowFileListMaximumLength && onOverflowFileListMaximumLength(total);
    } else {
      for (let i = 0; i < files.length; i++) {
        if (files[i].size > MAXSIZE) {
          onOverflowFileMaximumSize && onOverflowFileMaximumSize(files[i]);
        } else {
          const file = {
            file: files[i],
            uid: uuid(),
            size: files[i].size,
            name: files[i].name,
            status: Status.Uploading,
            response: null,
            progress: 0
          }
          list.push(file);
          queueFile(file);
        }
      }
      applyOnChange();
    }
  }

  const handleLargeFileChange = (file: File) => {
    if (isFuntion(onEnter) && onEnter(file)) {
      fragmentation(file)
      list.push({
        file: file,
        uid: uuid(),
        size: file.size,
        name: file.name,
        status: Status.Uploading,
        response: null,
        progress: 0
      })
      applyOnChange()
    }
  }

  const handleFileChange = () => {
    let files = ((inputFileEl.current as unknown) as HTMLInputElement).files;
    if (files) {
      if (!isLargeFile) {
        handleNormalFileChange(files);
      } else {
        handleLargeFileChange(files[0]);
      }
    }
  }

  const queueFile = (file: IFile) => {
    queue.push(file);
    flushFiles();
  }

  const flushFiles = () => {
    if (uploadingQueue.length < concurrency && queue.length > 0) {
      const uploadFile = queue.shift() as IFile;
      if (isFuntion(onEnter) && onEnter(uploadFile.file)) {
        uploadingQueue.push(uploadFile);
        submitFile();
      }
    }
  }

  const flushChunks = () => {
    if (uploadingChunkQueue.length < chunkConcurrency && chunks.length > 0) {
      const uploadChunk = chunks.shift() as IChunk;
      uploadingChunkQueue.push(uploadChunk);
      submitChunk();
    }
  }

  const submitFile = () => {
    const uploadFile = uploadingQueue.shift() as IFile;
    const formData = new FormData();
    formData.append('file', uploadFile.file);
  }

  const submitChunk = () => {
    const uploadChunk = uploadingChunkQueue.shift() as IChunk;
    const formData = new FormData();
    formData.append('index', uploadChunk.index);
    formData.append('md5', uploadChunk.md5);
    formData.append('file', uploadChunk.blob);
  }

  const submitChunkMerge = () => {
  }
  
  // 文件分片
  const fragmentation = (file: File) => {
    if (file.size > chunkSize) {
      let start = 0;
      let end = 0;
      let index = 0;
      while (true) {
        end += chunkSize;
        const blob = file.slice(start, end);
        start = end;
        index += 1;
        if (!blob.size) {
          break;
        }
        chunks.push({
          blob,
          index: index + '',
          md5: md5(blob)
        });
        flushChunks();
      }
    } else {
      const blob = file.slice(0);
      chunks.push({
        blob,
        index: `0`,
        md5: md5(blob)
      });
      flushChunks();
    }
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
