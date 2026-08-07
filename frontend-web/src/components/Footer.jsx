import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-6 mt-auto text-gray-500 bg-transparent">
      <div className="text-center text-sm">
        {/* Created by <strong> Akash Kulkarni</strong> */}
      </div>
      <div className="text-center text-sm mt-1">
        &copy; {currentYear} Koda. All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;