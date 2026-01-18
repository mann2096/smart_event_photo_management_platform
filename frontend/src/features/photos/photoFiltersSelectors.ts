import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

export const selectPhotoFilters = (state: RootState) =>
  state.photoFilters;

export const selectStablePhotoFilters = createSelector(
  [selectPhotoFilters],
  (filters) => filters
);
