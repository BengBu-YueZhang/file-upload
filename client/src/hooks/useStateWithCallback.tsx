import React, { useState, useEffect, useRef } from 'react';

function useStateWithCallback<T>(
  initialState: T | (() => T)
): [T, (value: React.SetStateAction<T>, callback?: ((state: T) => void) | undefined) => void] {

  const setStateCallback = useRef<((state: T) => void) | undefined>(undefined);
  const [state, setState] = useState<T>(initialState);
  const setStateWrapper = function (
    value: React.SetStateAction<T>,
    callback?: ((state: T) => void) | undefined
  ): void {
    setStateCallback.current = callback;
    setState(value);
  };

  useEffect(function () {
    setStateCallback.current && setStateCallback.current(state);
  }, [state]);

  return [
    state,
    setStateWrapper
  ];
};

export default useStateWithCallback;
