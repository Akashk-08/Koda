import React, { useState, useEffect, useRef } from 'react';

type StatusKey = 'OPEN' | 'COMPLETE' | 'CLOSED';

interface WorkOrderStatusMenuProps {
  workOrderId: string;
  currentStatus?: string;
  onStatusUpdated?: (newStatus: string) => void;
}

const STATUS_MAP: Record<StatusKey, { label: string; classes: string }> = {
  OPEN: { label: 'Open', classes: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' },
  COMPLETE: { label: 'Complete', classes: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' },
  CLOSED: { label: 'Closed', classes: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200' },
};

export default function WorkOrderStatusMenu({ workOrderId, currentStatus, onStatusUpdated }: WorkOrderStatusMenuProps) {
  const [status, setStatus] = useState<StatusKey>((currentStatus as StatusKey) || 'OPEN');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus: StatusKey) => {
    setIsOpen(false);
    if (newStatus === status) return;
    
    // 1. OPTIMISTIC UPDATE: Change UI instantly, no loading states
    const previousStatus = status;
    setStatus(newStatus);
    
    // 2. BACKGROUND SYNC: Update database silently
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/workorders/${workOrderId}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error("Backend failed");
      
      // Trigger parent refresh for activity logs only after success
      if (onStatusUpdated) onStatusUpdated(newStatus);
    } catch (error) {
      console.error("Status update error:", error);
      // 3. ROLLBACK: Only revert if the network request actually fails
      setStatus(previousStatus);
    }
  };

  const currentTheme = STATUS_MAP[status] || STATUS_MAP.OPEN;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between w-36 px-3 py-1.5 text-sm font-bold border rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${currentTheme.classes}`}
      >
        {currentTheme.label}
        <svg className="w-4 h-4 ml-2 -mr-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 w-40 mt-1 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {Object.entries(STATUS_MAP).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key as StatusKey)}
                className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${status === key ? 'font-bold bg-gray-50 text-gray-900' : 'text-gray-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}