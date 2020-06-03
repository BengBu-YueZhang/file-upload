import React, {
  useState,
  useRef,
  useMemo
} from 'react';
import './index.css'
import http from '../../utils/http';
import noop from '../../utils/noop';
import uuid from '../../utils/uuid';

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
};

export interface iFile {
};

const Upload: React.FC<IUpload> = (props) => {

  const {
    children,
    accept,
    action,
    drag,
    multiple,
    headers,
    concurrency,
    chunkConcurrency,
    MAXSIZE,
    chunkSize,
    breakpointResume,
    large,
    onChange,
    onSuccess,
    onError
  } = props;
  const inputFileEl = useRef(null);
  const inputFileElId = useMemo(() => uuid(), []);
  const isLarge = useMemo(() => large || breakpointResume, [large, breakpointResume]);
  // 使用两个数组，做并发上传的限制
  // 文件待上传队列
  const fileQueue = useState([]);
  // 正在上传的文件队列
  const uploadFileQueue = useState([]);
  // chunk待上传队列
  const chunkQueue = useState([]);
  // 正在上传的chunk队列
  const uploadChunkQueue = useState([]);

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

  const handleLargeFile = (file: File) => {
  };

  const handleSmallFile = (files: FileList) => {
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
  onError: noop
};

export default Upload;
