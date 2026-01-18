import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 shrink-0 border-r bg-white">
        <Sidebar />
      </aside>
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="shrink-0 border-b bg-white">
          <Navbar />
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet  />
        </main>
      </div>
    </div>
  );
}
