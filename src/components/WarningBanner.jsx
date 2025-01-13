import React from 'react';
import { AlertTriangle } from 'lucide-react';

const WarningBanner = () => {
  return (
    <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2">
      <AlertTriangle className="w-4 h-4 text-amber-600" />
      <p className="text-sm text-amber-800 font-medium">
        Warning: Closing this browser or tab will delete all your work. Please save your progress regularly.
      </p>
    </div>
  );
};

export default WarningBanner;