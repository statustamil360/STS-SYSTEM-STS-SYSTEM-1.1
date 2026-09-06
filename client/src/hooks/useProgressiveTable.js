import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const TABLE_FIRST_CHUNK = 12;

/**
 * Fast first paint of 12 rows, then load the remaining records in the background.
 * Pagination is applied client-side after the first chunk so the table feels instant.
 */
const useProgressiveTable = (fetcher, { enabled = true } = {}) => {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(TABLE_FIRST_CHUNK);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setPage(0);

    try {
      const first = await fetcher({ page: 1, limit: TABLE_FIRST_CHUNK });
      if (requestId !== requestIdRef.current) return;
      const firstRows = first.rows ?? [];
      const totalCount = first.total ?? firstRows.length;
      setAllRows(firstRows);
      setTotal(totalCount);
      setLoading(false);

      if (totalCount > firstRows.length) {
        setLoadingMore(true);
        const rest = await fetcher({ page: 1, limit: totalCount });
        if (requestId !== requestIdRef.current) return;
        setAllRows(rest.rows ?? firstRows);
        setTotal(rest.total ?? totalCount);
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setAllRows([]);
      setTotal(0);
      setError(err);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [fetcher]);

  useEffect(() => {
    if (!enabled) return;
    reload();
  }, [reload, enabled]);

  const rows = useMemo(
    () => allRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [allRows, page, rowsPerPage]
  );

  const changeRowsPerPage = useCallback((value) => {
    setRowsPerPage(value);
    setPage(0);
  }, []);

  return {
    rows,
    allRows,
    loading,
    loadingMore,
    total,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage: changeRowsPerPage,
    reload,
    error,
  };
};

export default useProgressiveTable;
