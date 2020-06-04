import React, {
  useState,
  useRef,
  useMemo
} from 'react';
import './index.css'
import http from '../../utils/http';
import noop from '../../utils/noop';
import uuid from '../../utils/uuid';

enum UploadStatus {
  Uploading,
  Done,
  Error
};

export interface IUpload {
  accept?: string; // 允许上传的文件类型
  action?: string; // 上传地址
  drag?: boolean; // 是否支持拖拽上传
  multiple?: boolean; // 是否支持多选，如果开启大文件上传，则不支持多选
  headers?: object; // 上传请求头
  concurrency?: number; // 上传文件的并发数
  chunkConcurrency?: number; // 切片上传的并发数
  MAXSIZE?: number; // 文件大小上限, 开启大文件上传配置无效
  chunkSize?: number; // 切片的大小
  breakpointResume?: boolean; // 是否支持断点上传
  large?: boolean; // 是否支持大文件上传
  onChange?: () => void;
  onSuccess?: () => void; // 上传成功的回调
  onError?: () => void; // 上传失败的回调
  onOversize?: (file: File) => void;
};

export interface IFile {
  file: File;
  uid: string;
  size: number;
  name: string;
  status: UploadStatus;
  response: JSON | null;
  progress: number;
};

export interface IChunk {
  blob: Blob;
  name: string;
  index: number;
  status: UploadStatus;
  progress: number;
};

const Upload: React.FC<IUpload> = (props) => {

  const {
    children,
    accept,
    action,
    drag,
    headers,
    concurrency,
    chunkConcurrency,
    MAXSIZE,
    chunkSize,
    breakpointResume,
    large,
    onChange,
    onSuccess,
    onError,
    onOversize
  } = props;
  let {
    multiple
  } = props;
  const inputFileEl = useRef(null);
  const inputFileElId = useMemo(() => uuid(), []);
  const isLarge = useMemo(() => large || breakpointResume, [large, breakpointResume]);
  const isBreakpointResume;
  // 文件列表
  const [fileList, setFileList] = useState<IFile[]>([]);
  // chunk列表
  const [chunkList, setChunkList] = useState<IChunk[]>([]);
  // 使用两个数组，做并发上传的限制
  // 文件待上传队列
  const [fileQueue, setFileQueue] = useState<IFile[]>([]);
  // 正在上传的文件队列
  const [uploadFileQueue, setUploadFileQueue] = useState<IFile[]>([]);
  // chunk待上传队列
  const [chunkQueue, setChunkQueue] = useState<IChunk[]>([]);
  // 正在上传的chunk队列
  const [uploadChunkQueue, setUploadChunkQueue] = useState<IChunk[]>([]);

  // 如果是大文件上传，必须是单选
  if (isLarge && multiple) {
    multiple = false;
  }

  const handleChange = () => {
    const files = ((inputFileEl.current as any) as HTMLInputElement).files;
    if (files) {
      if (isLarge) {
        handleLargeFile(files[0]);
      } else {
        handleSmallFile(files);
      }
    }
  };

  const handleDrag = () => {
  }

  const handleLargeFile = (file: File) => {
    const fileItem = {
      file: file,
      uid: uuid(),
      size: file.size,
      name: file.name,
      status: UploadStatus.Uploading,
      response: null,
      progress: 0
    };
    setFileList(prevFileList => [...prevFileList, fileItem]);
    fileSlicing(file);
  };

  const handleSmallFile = (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > (MAXSIZE as number)) {
        onOversize && onOversize(files[i]);
        continue;
      } else {
        const fileItem = {
          file: files[i],
          uid: uuid(),
          size: files[i].size,
          name: files[i].name,
          status: UploadStatus.Uploading,
          response: null,
          progress: 0
        };
        setFileList(prevFileList => [...prevFileList, fileItem])
        addFileQueue(fileItem);
      }
    }
  };

  const addFileQueue = (file: IFile) => {
    setFileQueue(prevFileQueue => [...prevFileQueue, file]);
    flushFileQueue();
  };

  const flushFileQueue = () => {
    if (
      uploadFileQueue.length < (concurrency as number) &&
      fileQueue.length > 0
    ) {
      const awaitUploadFile = fileQueue[0];
      setFileQueue(prevFileQueue => {
        prevFileQueue.shift();
        return [...prevFileQueue];
      });
      setUploadFileQueue(prevUploadFileQueue => [...prevUploadFileQueue, awaitUploadFile]);
      submitFileQueue();
    }
  };

  const submitFileQueue = () => {
  };

  // 大文件切片
  const fileSlicing = (file: File) => {
    const name = file.name;
    if (file.size > (chunkSize as number)) {
      let startPointer = 0;
      let endPointer = 0;
      let index = -1;
      while (true) {
        startPointer += chunkSize as number;
        const blob = file.slice(startPointer, endPointer);
        startPointer = endPointer;
        index += 1;
        if (!blob.size) {
          break;
        }
        const chunkItem = {
          blob,
          name,
          index,
          status: UploadStatus.Uploading,
          progress: 0
        };
        setChunkList(prevChunkList => [...prevChunkList, chunkItem]);
        addChunkQueue(chunkItem);
      }
    } else {
      const blob = file.slice(0);
      const chunkItem = {
        blob,
        name,
        index: 0,
        status: UploadStatus.Uploading,
        progress: 0
      };
      setChunkList(prevChunkList => [...prevChunkList, chunkItem]);
      addChunkQueue(chunkItem);
    }
  };

  const addChunkQueue = (chunk: IChunk) => {
  };

  const flushChunkQueue = () => {
  };

  const submitChunkQueue = () => {
  };

  return (
    <label
      htmlFor={inputFileElId}
    >
      <input
        id={inputFileElId}
        ref={inputFileEl}
        type="file"
        style={{display: 'none'}}
        multiple={multiple}
        accept={accept}
        onChange={handleChange}
      />
      {
        children
      }
    </label>
  )
};

Upload.defaultProps = {
  accept: 'image/*,.doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  action: '',
  drag: false,
  multiple: false,
  headers: {},
  concurrency: 2,
  chunkConcurrency: 4,
  MAXSIZE: 10 * 1024 * 1024,
  chunkSize: 1 * 1024 * 1024,
  breakpointResume: false,
  large: false,
  onChange: noop,
  onSuccess: noop,
  onError: noop,
  onOversize: noop
};

export default Upload;
