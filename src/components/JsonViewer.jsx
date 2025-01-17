import React, { useState, useEffect } from 'react';
import { Download, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

// Field ordering constants
const FIELD_ORDER = [
  'Background/Introduction',
  'Methods/Approach',
  'Results/Findings',
  'Conclusions/Implications',
  'Text',
  'Main Action',
  'Arguments'
];

const ARGUMENTS_ORDER = [
  'Agent',
  'Object',
  'Context',  
  'Purpose',
  'Method',
  'Results',
  'Analysis',
  'Challenge',
  'Ethical',
  'Implications',
  'Contradictions'
];

const OBJECT_FIELD_ORDER = [
  'Base Object',
  'Base Modifier',
  'Attached Object',
  'Attached Modifier'
];

const EVENT_TYPES = [
  'Background/Introduction',
  'Methods/Approach',
  'Results/Findings',
  'Conclusions/Implications'
];

// UI Colors
const SYNTAX_COLORS = {
  key: 'text-yellow-300 font-medium',
  string: 'text-emerald-300',
  bracket: 'text-blue-300',
  colon: 'text-gray-300',
  comma: 'text-gray-400'
};

const JsonViewer = ({ data, onDownload, onRemoveAnnotation }) => {
  const [expandedPaths, setExpandedPaths] = useState(new Set(['Arguments', 'Arguments.Object']));

  useEffect(() => {
    const pathsToExpand = new Set(['Arguments', 'Arguments.Object']);
    
    const findPathsWithValues = (obj, currentPath = '') => {
      if (!obj) return;
      
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        
        if (value && typeof value === 'string' && value !== '') {
          pathsToExpand.add(newPath);
          let parentPath = newPath.split('.').slice(0, -1).join('.');
          while (parentPath) {
            pathsToExpand.add(parentPath);
            parentPath = parentPath.split('.').slice(0, -1).join('.');
          }
        } else if (typeof value === 'object' && value !== null) {
          if (Object.values(value).some(v => v && v !== '')) {
            pathsToExpand.add(newPath);
          }
          findPathsWithValues(value, newPath);
        }
      });
    };

    findPathsWithValues(data);
    setExpandedPaths(pathsToExpand);
  }, [data]);

  const isArgumentSection = (path) => {
    return path === 'Arguments' || 
           path.startsWith('Arguments.') || 
           path === 'Main Action';
  };

  const togglePath = (path) => {
    if (isArgumentSection(path)) return;
    
    setExpandedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleDelete = (path, e) => {
    e.stopPropagation();
    e.preventDefault();
    onRemoveAnnotation(path);
  };

  const shouldCollapse = (key, value) => {
    return typeof value === 'object' && value !== null && Object.keys(value).length > 0;
  };

  const renderValue = (value, path) => {
    if (Array.isArray(value)) {
      const nonEmptyValues = value.filter(item => item && item !== '');
      if (nonEmptyValues.length === 0) {
        return <span className={SYNTAX_COLORS.string}>""</span>;
      }
      return (
        <div className="flex flex-col">
          {nonEmptyValues.map((item, index) => (
            <div key={index} className="flex items-center group py-0.5">
              <span className={SYNTAX_COLORS.string}>"{item}"</span>
              <button
                onClick={(e) => handleDelete(`${path}.${index}`, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded ml-2
                         transition-opacity focus:opacity-100 focus:outline-none
                         focus:ring-1 focus:ring-red-500"
                aria-label={`Remove annotation`}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-300" />
              </button>
              {index < nonEmptyValues.length - 1 && (
                <span className={SYNTAX_COLORS.comma}>, </span>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'string' && value) {
      return (
        <div className="flex items-center group">
          <span className={SYNTAX_COLORS.string}>"{value}"</span>
          <button
            onClick={(e) => handleDelete(path, e)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded ml-2
                     transition-opacity focus:opacity-100 focus:outline-none
                     focus:ring-1 focus:ring-red-500"
            aria-label={`Remove annotation`}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-300" />
          </button>
        </div>
      );
    }

    return <span className={SYNTAX_COLORS.string}>"{value}"</span>;
  };

  const sortEntries = (entries, orderArray) => {
    return entries.sort((a, b) => {
      const indexA = orderArray.indexOf(a[0]);
      const indexB = orderArray.indexOf(b[0]);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  const renderField = (key, value, depth = 0, path = '') => {
    const indent = '  '.repeat(depth);
    const isCollapsible = shouldCollapse(key, value) && !Array.isArray(value);
    const currentPath = path ? `${path}.${key}` : key;
    const isExpanded = isArgumentSection(currentPath) ? true : expandedPaths.has(currentPath);

    if (isCollapsible) {
      return (
        <div key={key} className="group font-mono">
          <div
            className={`flex items-center group py-0.5 hover:bg-gray-800/50 rounded px-2 -mx-2
                     focus-within:ring-1 focus-within:ring-blue-500 focus-within:outline-none
                     ${isArgumentSection(currentPath) ? 'cursor-default' : 'cursor-pointer'}`}
            onClick={() => !isArgumentSection(currentPath) && togglePath(currentPath)}
            role={isArgumentSection(currentPath) ? undefined : "button"}
            tabIndex={isArgumentSection(currentPath) ? undefined : 0}
            aria-expanded={isExpanded}
            onKeyPress={(e) => !isArgumentSection(currentPath) && e.key === 'Enter' && togglePath(currentPath)}
          >
            <span className="text-gray-400 w-4">
              {isExpanded ? 
                <ChevronDown className="w-3.5 h-3.5" /> : 
                <ChevronRight className="w-3.5 h-3.5" />
              }
            </span>
            <span className={SYNTAX_COLORS.key}>{indent}"{key}"</span>
            <span className={SYNTAX_COLORS.colon}>: </span>
            <span className={SYNTAX_COLORS.bracket}>{Array.isArray(value) ? '[' : '{'}</span>
          </div>

          <div className={isExpanded ? 'ml-4' : 'hidden'}>
            {Array.isArray(value) ? (
              renderValue(value, currentPath)
            ) : (
              (() => {
                let entries = Object.entries(value);
                if (path === '') {
                  entries = sortEntries(entries, FIELD_ORDER);
                } else if (path === 'Arguments') {
                  entries = sortEntries(entries, ARGUMENTS_ORDER);
                } else if (path === 'Arguments.Object') {
                  entries = sortEntries(entries, OBJECT_FIELD_ORDER);
                }
                return entries.map(([k, v], index) => (
                  <React.Fragment key={k}>
                    {renderField(k, v, depth + 1, currentPath)}
                    {index < entries.length - 1 && (
                      <span className={SYNTAX_COLORS.comma}>,</span>
                    )}
                  </React.Fragment>
                ));
              })()
            )}
          </div>

          <div className={isExpanded ? 'py-0.5' : 'hidden'}>
            <span className={SYNTAX_COLORS.bracket}>
              {indent}{Array.isArray(value) ? ']' : '}'}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div key={key} className="flex items-center group py-0.5 font-mono">
        <span className={SYNTAX_COLORS.key}>{indent}"{key}"</span>
        <span className={SYNTAX_COLORS.colon}>: </span>
        {renderValue(value, currentPath)}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-800">
      <div className="bg-gray-800/50 px-4 py-3 flex justify-between items-center border-b border-gray-700">
        <h3 className="text-gray-100 font-medium tracking-wide">JSON Output</h3>
        <button
          onClick={onDownload}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Download JSON"
          aria-label="Download JSON file"
        >
          <Download className="w-4 h-4 text-gray-400 hover:text-gray-300" />
        </button>
      </div>

      <div 
        className="p-4 text-sm overflow-auto max-h-[calc(100vh-24rem)]
                   scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        role="region"
        aria-label="JSON content viewer"
      >
        <div className={SYNTAX_COLORS.bracket}>{'{'}</div>
        <div className="ml-4">
          {(() => {
            const entries = sortEntries(Object.entries(data), FIELD_ORDER);
            return entries.map(([key, value], index) => (
              <React.Fragment key={key}>
                {renderField(key, value, 1)}
                {index < entries.length - 1 && (
                  <span className={SYNTAX_COLORS.comma}>,</span>
                )}
              </React.Fragment>
            ));
          })()}
        </div>
        <div className={SYNTAX_COLORS.bracket}>{'}'}</div>
      </div>
    </div>
  );
};

export default JsonViewer;