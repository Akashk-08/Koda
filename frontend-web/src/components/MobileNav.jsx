import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Inbox, Menu, Plus } from 'lucide-react';

const MobileNav = ({ onOpenModal }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* FLOATING ACTION BUTTON (+) */}
      {/* <button
        onClick={onOpenModal}
        className="md:hidden fixed bottom-20 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        <Plus className="w-7 h-7" />
      </button> */}

      {/* BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 px-6 py-2 flex justify-between items-center z-40 pb-[env(safe-area-inset-bottom)]">
        <Link to="/workspace/workorders" className={`flex flex-col items-center gap-1 ${isActive('/workspace/workorders') ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}>
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </Link>

        <Link to="/workspace/workorders" className={`flex flex-col items-center gap-1 ${isActive('/workspace/workorders') ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}>
          <ClipboardList className="w-5 h-5" />
          <span className="text-[10px]">Work Orders</span>
        </Link>

        <Link to="/resources/requests" className={`flex flex-col items-center gap-1 ${isActive('/resources/requests') ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}>
          <Inbox className="w-5 h-5" />
          <span className="text-[10px]">Requests</span>
        </Link>

        <Link to="/profile" className={`flex flex-col items-center gap-1 ${isActive('/profile') ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}>
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">More</span>
        </Link>
      </div>
    </>
  );
};

export default MobileNav;