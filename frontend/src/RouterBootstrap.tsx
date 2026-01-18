import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppDispatch } from "./app/hooks";
import { setFilters } from "./features/photos/photoFiltersSlice";
import { filtersFromUrl } from "./utils/filtersFromUrl";

export default function RouterBootstrap() {
  const location = useLocation();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const parsed = filtersFromUrl(location.search);
    dispatch(setFilters(parsed));
  }, []);

  return null;
}
