import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, Calendar as CalendarIcon } from 'lucide-react';

const Calendar = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]); // This will hold the user's events

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '' });

  // Load saved events from local storage (or replace with API fetch later)
  useEffect(() => {
    const savedEvents = localStorage.getItem('pulseworks_events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  // Calendar Month Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Handle Adding a New Event
  const handleAddEvent = (e) => {
    e.preventDefault();

    const eventObj = {
      id: Date.now().toString(),
      userId: user.id, // Strictly tie this event to the logged-in user
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
    };

    const updatedEvents = [...events, eventObj];
    setEvents(updatedEvents);
    localStorage.setItem('pulseworks_events', JSON.stringify(updatedEvents)); // Mock DB save

    setIsAddModalOpen(false);
    setNewEvent({ title: '', date: '', time: '' }); // Reset form
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-50 p-6 sm:p-10 overflow-hidden font-sans">
      <div className="w-full h-full flex flex-col">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 shrink-0">
          <div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span>Workspace</span>
              <span className="mx-2">/</span>
              <span className="text-blue-600 font-bold">Calendar</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Workspace Calendar</h1>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>

        {/* FULL WIDTH CALENDAR GRID */}
        <div className="flex-1 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col min-h-0">

          {/* Calendar Controls */}
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-2xl font-black text-gray-900">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-400 mb-3 shrink-0">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          {/* Days Grid - Expands to fill available vertical space */}
          <div className="flex-1 grid grid-cols-7 gap-2 overflow-y-auto custom-scrollbar pr-1 pb-1">

            {/* Empty slots for days before the 1st of the month */}
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[120px] bg-gray-50/50 rounded-2xl border border-transparent"></div>
            ))}

            {/* Actual Days */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const dayNum = index + 1;
              const currentDateObj = new Date(year, month, dayNum);
              const isToday = new Date().toDateString() === currentDateObj.toDateString();

              // 1. Format the current cell's date to YYYY-MM-DD to match the HTML date input format
              const formattedCellDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

              // 2. Filter events: Must belong to THIS user AND match THIS date
              const dayEvents = events.filter(ev => ev.userId === user.id && ev.date === formattedCellDate);

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`min-h-[120px] p-2.5 rounded-2xl border flex flex-col transition-all overflow-hidden ${isToday ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-100' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-sm font-extrabold ${isToday ? 'text-blue-600 bg-blue-100 w-7 h-7 rounded-full flex items-center justify-center' : 'text-gray-700 ml-1 mt-0.5'}`}>
                      {dayNum}
                    </span>
                  </div>

                  {/* Event List for this specific day */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                    {dayEvents.map(ev => (
                      <div key={ev.id} className="bg-blue-600 text-white p-1.5 rounded-md shadow-sm border border-blue-700 flex flex-col gap-0.5 group relative cursor-default">
                        <span className="text-[10px] font-bold leading-tight truncate">{ev.title}</span>
                        {ev.time && (
                          <span className="text-[9px] font-medium text-blue-100 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> {ev.time}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ADD EVENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-gray-900">Add New Event</h2>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Event Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Site Inspection"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Date</label>
                <input
                  required
                  type="date"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-gray-700"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Time (Optional)</label>
                <input
                  type="time"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-gray-700"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold shadow-md transition-all mt-4"
              >
                Save Event
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Calendar;