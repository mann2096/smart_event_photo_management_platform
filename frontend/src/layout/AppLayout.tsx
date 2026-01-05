import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import type { PhotoFilters } from "../types/photoFilters";

export default function AppLayout() {
  const [filters, setFilters] = useState<PhotoFilters>({
    startDate: undefined,
    endDate: undefined,
    tags: [],
    eventName: "",
    timeline: false,
  });

  return (
    <div className="flex flex-row">
      <Sidebar />
      <div>
        <Navbar
          filters={filters}
          setFilters={setFilters}
        />
        <Outlet context={{ filters }} />
      </div>
    </div>
  );
}
