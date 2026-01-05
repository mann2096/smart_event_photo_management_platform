import { useState } from "react";
import { useCreateEventMutation } from "../services/eventsApi";
import { useNavigate } from "react-router-dom";

export default function CreateEvent(){
  const navigate=useNavigate();
  const [createEvent,{isLoading}]=useCreateEventMutation();
  const [form,setForm]=useState({
    name:"",
    description:"",
    start_date:"",
    end_date:"",
    visibility:"private" as "private"|"public",
  });
  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    await createEvent(form).unwrap();
    navigate("/events");
  };
  return(
    <div>
      <h2>Create Event</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({...form,name:e.target.value})}/>
        </div>
        <div>
          <label>Description</label>
          <textarea value={form.description} onChange={(e) =>setForm({...form,description:e.target.value})}/>
        </div>
        <div>
          <label>Start Date</label>
          <input type="date" value={form.start_date} onChange={(e) => setForm({...form,start_date:e.target.value})}/>
        </div>
        <div>
          <label>End Date</label>
          <input type="date" value={form.end_date} onChange={(e) => setForm({...form,end_date:e.target.value})}/>
        </div>
        <div>
          <label>Visibility</label>
          <select
            value={form.visibility}
            onChange={(e) => setForm({...form,visibility: e.target.value as "public" | "private",})}>
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </div>
        <button type="submit" disabled={isLoading}>
          Create
        </button>
      </form>
    </div>
  );
}
