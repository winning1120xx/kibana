/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { Query } from '@kbn/es-query';
import { appSelectors } from '../store';
import { appActions } from '../store/app';
import { useAppToasts } from './use_app_toasts';
import { useDeepEqualSelector } from './use_selector';

export const genHash = (message: string) =>
  message
    .split('')
    // eslint-disable-next-line no-bitwise
    .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
    .toString();

interface UseInvalidFilterQueryProps {
  id: string;
  filterQuery?: string;
  kqlError?: Error;
  query?: Query;
  startDate?: string;
  endDate?: string;
}

/**
 * Adds a toast error message whenever invalid KQL is submitted through the search bar
 */
export const useInvalidFilterQuery = ({
  id,
  filterQuery,
  kqlError,
  // TODO: Review and remove these (query, startDate, endDate) props.
  // Change of any of these props will not trigger new error toast.
  query,
  startDate,
  endDate,
}: UseInvalidFilterQueryProps): void => {
  const { addError } = useAppToasts();
  const dispatch = useDispatch();
  const getErrorsSelector = useMemo(() => appSelectors.errorsSelector(), []);
  const errors = useDeepEqualSelector(getErrorsSelector);

  const name = kqlError?.name;
  const message = kqlError?.message;

  useEffect(() => {
    if (!filterQuery && message && name) {
      dispatch(
        appActions.addErrorHash({
          id,
          hash: genHash(message),
          title: name,
          message: [message],
        })
      );
    }
  }, [id, filterQuery, addError, query, startDate, endDate, dispatch, message, name]);

  useEffect(() => {
    const myError = errors.find((e) => e.id === id);
    if (myError != null && myError.displayError && kqlError != null) {
      // Removes error stack from user view
      delete kqlError.stack; // Mutates the error object and can possibly lead to side effects, only going this route for type issues. Change when we add a stackless toast error
      addError(kqlError, { title: kqlError.name });
    }
  }, [addError, errors, id, kqlError]);
};
