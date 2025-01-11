import React, { useState, useRef } from 'react';
import { X, ChevronLeft } from 'lucide-react';

const SelectionToolbar = ({ position, onSelect, onClose }) => {
  const [showObjectArgs, setShowObjectArgs] = useState(false); // State to toggle sub-arguments
  const toolbarRef = useRef(null);

  // Handle Object sub-argument selection
  const handleObjectSelect = (objectType) => {
    onSelect(`Object.${objectType}`); // Pass the selected sub-argument to the parent
    setShowObjectArgs(false); // Hide sub-arguments after selection
  };

  return (
    <div 
      ref={toolbarRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
      style={{
        top: position.top - 10,
        left: position.left + (position.width / 2),
        transform: 'translate(-50%, -100%)'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          {showObjectArgs && (
            <button
              onClick={() => setShowObjectArgs(false)} // Go back to main buttons
              className="p-1 hover:bg-gray-100 rounded-full"
              aria-label="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-sm font-medium">
            {showObjectArgs ? 'Select Object Type' : 'Annotate Selection'}
          </span>
        </div>
        <button onClick={onClose} aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Buttons */}
      <div className="grid gap-2">
        {!showObjectArgs ? (
          // Main buttons
          <>
            <button
              onClick={() => onSelect('Main_Action')}
              className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg"
              aria-label="Main Action"
            >
              Main Action
            </button>
            <button
              onClick={() => onSelect('Agent')}
              className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg"
              aria-label="Agent"
            >
              Agent
            </button>
            <button
              onClick={() => setShowObjectArgs(true)} // Show sub-arguments for Object
              className="w-full text-left px-3 py-2 bg-violet-50 hover:bg-violet-100 rounded-lg"
              aria-label="Object"
            >
              Object
            </button>
            <button
              onClick={() => onSelect('Context')}
              className="w-full text-left px-3 py-2 bg-orange-50 hover:bg-orange-100 rounded-lg"
              aria-label="Context"
            >
              Context
            </button>
            <button
              onClick={() => onSelect('Purpose')}
              className="w-full text-left px-3 py-2 bg-pink-50 hover:bg-pink-100 rounded-lg"
              aria-label="Purpose"
            >
              Purpose
            </button>
            <button
              onClick={() => onSelect('Method')}
              className="w-full text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg"
              aria-label="Method"
            >
              Method
            </button>
            <button
              onClick={() => onSelect('Results')}
              className="w-full text-left px-3 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
              aria-label="Results"
            >
              Results
            </button>
            <button
              onClick={() => onSelect('Analysis')}
              className="w-full text-left px-3 py-2 bg-cyan-50 hover:bg-cyan-100 rounded-lg"
              aria-label="Analysis"
            >
              Analysis
            </button>
            <button
              onClick={() => onSelect('Challenge')}
              className="w-full text-left px-3 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
              aria-label="Challenge"
            >
              Challenge
            </button>
            <button
              onClick={() => onSelect('Ethical')}
              className="w-full text-left px-3 py-2 bg-amber-50 hover:bg-amber-100 rounded-lg"
              aria-label="Ethical"
            >
              Ethical
            </button>
            <button
              onClick={() => onSelect('Implications')}
              className="w-full text-left px-3 py-2 bg-rose-50 hover:bg-rose-100 rounded-lg"
              aria-label="Implications"
            >
              Implications
            </button>
            <button
              onClick={() => onSelect('Contradictions')}
              className="w-full text-left px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg"
              aria-label="Contradictions"
            >
              Contradictions
            </button>
          </>
        ) : (
          // Sub-arguments for Object
          <>
            <button
              onClick={() => handleObjectSelect('Base_Object')}
              className="w-full text-left px-3 py-2 bg-violet-50 hover:bg-violet-100 rounded-lg"
              aria-label="Base Object"
            >
              Base Object
            </button>
            <button
              onClick={() => handleObjectSelect('Base_Modifier')}
              className="w-full text-left px-3 py-2 bg-violet-50 hover:bg-violet-100 rounded-lg"
              aria-label="Base Modifier"
            >
              Base Modifier
            </button>
            <button
              onClick={() => handleObjectSelect('Attached_Object')}
              className="w-full text-left px-3 py-2 bg-violet-50 hover:bg-violet-100 rounded-lg"
              aria-label="Attached Object"
            >
              Attached Object
            </button>
            <button
              onClick={() => handleObjectSelect('Attached_Modifier')}
              className="w-full text-left px-3 py-2 bg-violet-50 hover:bg-violet-100 rounded-lg"
              aria-label="Attached Modifier"
            >
              Attached Modifier
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SelectionToolbar;