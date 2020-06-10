import React, { useState, useEffect } from 'react';

function useStateWithCallback<T>(
  initialState: T | (() => T)
): [T, (value: React.SetStateAction<T>, callback?: (() => void) | undefined) => void] {
  let setStateCallback: (() => void) | undefined;
  const [state, setState] = useState<T>(initialState);
  const setStateWrapper = function (
    value: React.SetStateAction<T>,
    callback?: (() => void) | undefined
  ): void {
    setStateCallback = callback;
    setState(value);
  };

  useEffect(function () {
    setStateCallback && setStateCallback();
  }, [state]);

  return [
    state,
    setStateWrapper
  ];
};

export default useStateWithCallback;
