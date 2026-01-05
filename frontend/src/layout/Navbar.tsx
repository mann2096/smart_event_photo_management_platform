import type {PhotoFilters} from "../types/photoFilters";

type NavbarProps={
  filters:PhotoFilters;
  setFilters:React.Dispatch<React.SetStateAction<PhotoFilters>>;
};
export default function Navbar({filters,setFilters }:NavbarProps){
  const handleClearFilters = () => {
    setFilters({
      startDate:undefined,
      endDate:undefined,
      tags:[],
      eventName:"",
      timeline:false, 
    });
  };
  return(
    <header className="flex flex-row">
      <div className="flex flex-row">
        <h4>Date Range</h4>
        <label>
          From:
          <input type="date" value={filters.startDate||""} onChange={(e) => setFilters({...filters,startDate:e.target.value})}/>
        </label>
        <label>
          To:
          <input type="date" value={filters.endDate||""} onChange={(e) => setFilters({...filters,endDate:e.target.value})}/>
        </label>
      </div>
      <div className="flex flex-row">
        <h4>Tags</h4>
        <input type="text" placeholder="Enter tags (comma separated)" value={filters.tags.join(",")}onChange={(e) => setFilters({...filters,tags:e.target.value.split(",").map((t) => t.trim()).filter(Boolean),})}/>
      </div>
      <div className="flex flex-row">
        <h4>Event</h4>
        <input type="text" placeholder="Search by event name" value={filters.eventName} onChange={(e) =>setFilters({...filters,eventName:e.target.value})}/>
      </div>
      <div>
        <label>
          <input type="checkbox" checked={filters.timeline} onChange={(e) =>setFilters(prev => ({...prev,timeline: e.target.checked,}))}/>
          Timeline view
        </label>
      </div>
      <div>
        <button onClick={handleClearFilters}>Clear</button>
      </div>
      <div>
        <button>Profile</button>
      </div>
    </header>
  );
}
