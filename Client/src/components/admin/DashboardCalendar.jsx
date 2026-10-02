import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function DashboardCalendar({ role, onBack }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const res = await axios.get('/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const bookings = res.data.bookings || [];
      const formattedEvents = bookings
        // Only show confirmed or relevant bookings if needed (for now show all)
        .filter(b => b.status !== 'cancelled') 
        .map(b => {
          const eventDate = new Date(b.event_date);
          return {
            id: b.id,
            title: `${b.event_type} - ${b.customer_name}`,
            start: eventDate, // Assuming event_date is midnight or includes time
            end: new Date(eventDate.getTime() + 4 * 60 * 60 * 1000), // Default 4 hours later
            allDay: false,
            resource: b,
          };
        });
        
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Failed to fetch bookings for calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const eventStyleGetter = (event) => {
    const isDropOff = (event.resource.booking_category || '').toLowerCase() === 'drop-off';
    
    let backgroundColor = isDropOff ? '#0891b2' : '#f59e0b'; // Cyan for Drop-off, Amber for Full Service
    let borderColor = isDropOff ? '#06b6d4' : '#fbbf24';
    
    if (event.resource.status === 'completed') {
      backgroundColor = '#10b981'; // Emerald for completed
      borderColor = '#34d399';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '1px solid ' + borderColor,
        display: 'block',
        fontSize: '0.85rem',
        fontWeight: '500',
        padding: '2px 5px',
      }
    };
  };

  return (
    <div className="bg-[#101A2E] rounded-xl border border-[#1E2A45] p-6 shadow-lg h-[800px] flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-1.5 rounded-lg bg-[#1E2A45] text-slate-300 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-500/50 border border-transparent transition-all"
                title="Go Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <h2 className="text-xl font-semibold text-white">Event Calendar</h2>
          </div>
          <p className={`text-sm text-slate-400 mt-1 ${onBack ? 'ml-11' : ''}`}>Manage and view upcoming catered events</p>
        </div>
        <div className="flex gap-4 text-xs font-medium pt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-slate-300">Full Service</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-600"></div>
            <span className="text-slate-300">Drop-Off</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-slate-300">Completed</span>
          </div>
        </div>
      </div>
      
      <div className="flex-grow bg-white rounded-lg p-4 custom-calendar-container overflow-hidden text-charcoal">
        <style>{`
          .rbc-calendar { font-family: inherit; }
          .rbc-toolbar button { color: #374151; }
          .rbc-toolbar button.rbc-active { background-color: #f3f4f6; color: #111827; box-shadow: none; }
          .rbc-toolbar button:hover { background-color: #f9fafb; }
          .rbc-event { padding: 2px 5px; }
          .rbc-today { background-color: #fffbeb; }
        `}</style>
        
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-gold-500 border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month', 'week', 'day', 'agenda']}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={setSelectedEvent}
            popup
            tooltipAccessor={(e) => `${e.title}\nGuests: ${e.resource.number_of_guests || 'N/A'}\nStatus: ${e.resource.status}`}
          />
        )}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-[#1A2642] to-[#101A2E] p-4 border-b border-[#1E2A45] flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedEvent.title}</h3>
                <p className="text-sm text-cyan-400">{format(selectedEvent.start, 'EEEE, MMMM d, yyyy')}</p>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">Status</span>
                  <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-white/10 text-white capitalize border border-white/20">
                    {selectedEvent.resource.status}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">Type</span>
                  <span className="text-slate-200 capitalize">{selectedEvent.resource.booking_category || 'Full Service'}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">Guests</span>
                  <span className="text-slate-200">{selectedEvent.resource.number_of_guests || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">Budget</span>
                  <span className="text-slate-200 text-gold-400 font-medium">₱{Number(selectedEvent.resource.budget || 0).toLocaleString()}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1">Address</span>
                  <span className="text-slate-200">{selectedEvent.resource.customer_address || 'Not specified'}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#1E2A45] bg-[#0B1220] flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
