import React, {
  useState,
  useRef,
  useMemo,
  useEffect
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
  mergeAction?: string;
  drag?: boolean; // 是否支持拖拽上传
  multiple?: boolean; // 是否支持多选，如果开启大文件上传，则不支持多选
  headers?: object; // 上传请求头
  concurrency?: number; // 上传文件的并发数
  chunkConcurrency?: number; // 切片上传的并发数
  MAXSIZE?: number; // 文件大小上限, 开启大文件上传配置无效
  chunkSize?: number; // 切片的大小
  breakpointResume?: boolean; // 是否支持断点上传
  large?: boolean; // 是否支持大文件上传
  onChange?: (file: IFile, fileList: IFile[], chunkList?: IChunk[]) => void;
  onSuccess?: (res: any, file: IFile, fileList: IFile[], chunkList?: IChunk[]) => void; // 上传成功的回调
  onError?: (err: any, file: IFile, fileList: IFile[], chunkList?: IChunk[]) => void; // 上传失败的回调
  onOversize?: (file: File) => void; // 超出文件限制大小
  disabled?: boolean; // 是否禁用
};

export interface IFile {
  file: File;
  uid: string;
  size: number;
  name: string;
  status: UploadStatus;
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
    mergeAction,
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
    onOversize,
    disabled
  } = props;
  let {
    multiple
  } = props;
  const inputFileEl = useRef(null);
  // 只有大文件上传支持断点续传
  const isLarge = useMemo(() => large || breakpointResume, [large, breakpointResume]);
  const isBreakpointResume = useMemo(() => large && breakpointResume, [large, breakpointResume]);
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

  useEffect(() => {
    const onDrag = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener('drag', onDrag);
    return () => {
      document.removeEventListener('drag', onDrag);
    };
  }, []);

  const handleChange = () => {
    const files = ((inputFileEl.current as any) as HTMLInputElement).files;
    // 重置状态
    if (files) {
      if (isLarge) {
        handleLargeFile(files[0]);
      } else {
        handleSmallFile(files);
      }
    }
  };

  // 拖拽上传
  const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
    if (!drag) return;
    const files = event.dataTransfer.files;
    if (files) {
      if (isLarge) {
        handleLargeFile(files[0]);
      } else {
        handleSmallFile(files);
      }
    }
  };

  const handleDragover = (event: React.DragEvent<HTMLDivElement>) => {
    if (!drag) return;
  };

  const handleDragleave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!drag) return;
  }

  const handleLargeFile = (file: File) => {
    const fileItem = {
      file: file,
      uid: uuid(),
      size: file.size,
      name: file.name,
      status: UploadStatus.Uploading,
      progress: 0
    };
    setFileList(prevFileList => [...prevFileList, fileItem]);
    fileSlicing(file);
    onChange && onChange(fileItem, fileList);
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
          progress: 0
        };
        setFileList(prevFileList => [...prevFileList, fileItem])
        addFileQueue(fileItem);
        onChange && onChange(fileItem, fileList);
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
    // 并发上传
    for (let i = 0; i < uploadFileQueue.length; i++) {
      const uploadFile = uploadFileQueue[i]
      const uid = uploadFile.uid;
      const data = new FormData();
      data.append('file', uploadFile.file);
      data.append('filename', uploadFile.name);
      data.append('type', 'file');
      http({
        data,
        headers,
        method: 'post',
        url: action,
        onUploadProgress: (event: ProgressEvent) => {
          uploadFile.progress = event.loaded / event.total;
          onChange && onChange(uploadFile, fileList);
        }
      }).then(res => {
        uploadFile.status = UploadStatus.Done;
        uploadFile.progress = 1;
        onChange && onChange(uploadFile, fileList);
        onSuccess && onSuccess(res, uploadFile, fileList);
      }).catch(err => {
        uploadFile.status = UploadStatus.Error;
        uploadFile.progress = 0;
        onChange && onChange(uploadFile, fileList);
        onError && onError(err, uploadFile, fileList);
      }).finally(() => {
        setUploadFileQueue(prevUploadFileQueue => prevUploadFileQueue.filter(file => file.uid !== uid))
        flushFileQueue();
      })
    }
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
    setChunkQueue(prevChunkQueue => [...prevChunkQueue, chunk]);
    flushChunkQueue();
  };

  const flushChunkQueue = () => {
    if (
      uploadChunkQueue.length < (chunkConcurrency as number) &&
      chunkQueue.length > 0
    ) {
      const awaitUploadChunk = chunkQueue[0];
      setChunkQueue(prevChunkQueue => {
        prevChunkQueue.shift();
        return [...prevChunkQueue];
      })
      setUploadChunkQueue(prevUploadChunkQueue => [...prevUploadChunkQueue, awaitUploadChunk]);
      submitChunkQueue();
    } else {
      if (chunkQueue.length === 0) {
        // 所有切片上传完成
        mergeChunk(fileList[0]);
      }
    }
  };

  const submitChunkQueue = () => {
    for (let i = 0; i < chunkQueue.length; i++) {
      const uploadChunk = chunkQueue[i];
      const index = uploadChunk.index;
      const data = new FormData();
      data.append('chunk', uploadChunk.blob);
      // 原文件名 + chunk的索引
      data.append('chunkhash', `${uploadChunk.name}-${uploadChunk.index}`);
      data.append('filename', uploadChunk.name);
      data.append('type', 'chunk');
      http({
        data,
        headers,
        method: 'post',
        url: action,
        onUploadProgress: (event: ProgressEvent) => {
          uploadChunk.progress = event.loaded / event.total;
          // 大文件上传只支持单一文件上传
          onChange && onChange(fileList[0], fileList, chunkList);
        }
      }).then(res => {
        uploadChunk.status = UploadStatus.Done;
        uploadChunk.progress = 1;
        onChange && onChange(fileList[0], fileList, chunkList);
        setUploadChunkQueue(prevUploadChunkQueue => prevUploadChunkQueue.filter(chunk => chunk.index !== index));
        flushChunkQueue();
      }).catch(err => {
        // 如果有一个切片上传失败了，整个文件都算上传失败了
        uploadChunk.status = UploadStatus.Error;
        uploadChunk.progress = 0;
        fileList[0].status = UploadStatus.Error;
        fileList[0].progress = 0;
        onError && onError(err, fileList[0], fileList, chunkList);
      })
    }
  };

  const mergeChunk = (file: IFile) => {
    http({
      data: {
        filename: file.name
      },
      url: mergeAction,
      method: 'post'
    }).then(res => {
      file.status = UploadStatus.Done;
      file.progress = 1;
      onChange && onChange(file, fileList, chunkList);
      onSuccess && onSuccess(res, file, fileList, chunkList);
    }).catch(err => {
      file.status = UploadStatus.Error;
      file.progress = 0;
      onChange && onChange(file, fileList, chunkList);
      onError && onError(err, file, fileList, chunkList);
    })
  };

  const handleClick = () => {
    if (!disabled) {
      ((inputFileEl.current as any) as HTMLInputElement).value = '';
      ((inputFileEl.current as any) as HTMLInputElement).click();
    }
  };

  return (
    <span
      onClick={handleClick}
    >
      <div
        onDrag={handleDrag}
        onDragLeave={handleDragleave}
        onDragOver={handleDragover}
      />
      <input
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
    </span>
  )
};

Upload.defaultProps = {
  accept: 'image/*,.doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  action: '',
  mergeAction: '',
  drag: true,
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
  onOversize: noop,
  disabled: false
};

export default Upload;
