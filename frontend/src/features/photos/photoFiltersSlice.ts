import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { PhotoFilters } from "../../types/photoFilters";

const initialState: PhotoFilters = {
  startDate: undefined,
  endDate: undefined,
  tags: [],
  eventName: "",
  timeline: false,
};

const photoFiltersSlice = createSlice({
  name: "photoFilters",
  initialState,
  reducers: {
    setFilters(
      state,
      action: PayloadAction<Partial<PhotoFilters>>
    ) {
      Object.assign(state, action.payload);
    },

    clearFilters() {
      return initialState;
    },
  },
});

export const { setFilters, clearFilters } =
  photoFiltersSlice.actions;

export default photoFiltersSlice.reducer;
