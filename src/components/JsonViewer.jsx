import React, { useState, useEffect } from 'react';
import { Download, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

// Color scheme for syntax highlighting
const SYNTAX_COLORS = {
  key: 'text-yellow-300 font-medium',
  string: 'text-emerald-300',
  bracket: 'text-blue-300',
  colon: 'text-gray-300',
  comma: 'text-gray-400'
};

const JsonViewer = ({ data, onDownload, onRemoveAnnotation }) => {
  const [expandedPaths, setExpandedPaths] = useState(new Set([
    'Arguments', 
    'Arguments.Object',
    'Main Action',
    'Arguments.Agent',
    'Arguments.Context',
    'Arguments.Purpose',
    'Arguments.Method',
    'Arguments.Results',
    'Arguments.Analysis',
    'Arguments.Challenge',
    'Arguments.Ethical',
    'Arguments.Implications',
    'Arguments.Contradictions'
  ]));

  useEffect(() => {
    const pathsToExpand = new Set([...expandedPaths]);
    
    const findPathsWithValues = (obj, currentPath = '') => {
      if (!obj) return;
      
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        if (value && typeof value === 'string' && value !== '') {
          pathsToExpand.add(newPath);
        } else if (typeof value === 'object' && value !== null) {
          pathsToExpand.add(newPath);
          findPathsWithValues(value, newPath);
        }
      });
    };

    findPathsWithValues(data);
    setExpandedPaths(pathsToExpand);
  }, [data]);

  const togglePath = (path) => {
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

  const shouldCollapse = (key, value) => {
    return typeof value === 'object' && value !== null && Object.keys(value).length > 0;
  };

  const handleDelete = (path, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    const pathArray = path.split('.');
    const formattedPath = pathArray.map(part => 
      !isNaN(part) ? parseInt(part) : part
    ).join('.');
    
    if (formattedPath && onRemoveAnnotation) {
      onRemoveAnnotation(formattedPath);
      
      setExpandedPaths(prev => {
        const newPaths = new Set(prev);
        const parentPath = pathArray.slice(0, -1).join('.');
        if (parentPath && newPaths.has(parentPath)) {
          newPaths.delete(parentPath);
          setTimeout(() => {
            setExpandedPaths(current => new Set([...current, parentPath]));
          }, 0);
        }
        return newPaths;
      });
    }
  };

  const renderJsonField = (key, value, depth = 0, path = '') => {
    const indent = '  '.repeat(depth);
    const isCollapsible = shouldCollapse(key, value);
    const currentPath = path ? `${path}.${key}` : key;
    const isExpanded = expandedPaths.has(currentPath);

    if (isCollapsible) {
      return (
        <div key={key} className="group font-mono">
          <div 
            className="flex items-start cursor-pointer hover:bg-gray-800/50 rounded px-2 py-0.5 -mx-2
                     focus-within:ring-1 focus-within:ring-blue-500 focus-within:outline-none"
            onClick={() => togglePath(currentPath)}
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            aria-label={`Toggle ${key} section`}
            onKeyPress={(e) => e.key === 'Enter' && togglePath(currentPath)}
          >
            <span className="text-gray-400 w-4 mt-1">
              {isExpanded ? 
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" /> : 
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              }
            </span>
            <span className={SYNTAX_COLORS.key}>{indent}"{key}"</span>
            <span className={SYNTAX_COLORS.colon}>: </span>
            <span className={SYNTAX_COLORS.bracket}>{Array.isArray(value) ? '[' : '{'}</span>
          </div>
          <div className={`ml-4 ${isExpanded ? 'block' : 'hidden'}`}>
            {Array.isArray(value) 
              ? value.map((item, index) => (
                  <div key={index} className="group">
                    {typeof item === 'object' 
                      ? renderJsonField(index, item, depth + 1, currentPath)
                      : (
                        <div className="flex items-center gap-2 group py-0.5">
                          <span className={SYNTAX_COLORS.string}>{indent}  "{item}"</span>
                          <button
                            onClick={(e) => handleDelete(`${currentPath}.${index}`, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded
                                     transition-opacity focus:opacity-100 focus:outline-none
                                     focus:ring-1 focus:ring-red-500"
                            aria-label={`Remove ${item} annotation`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-300" />
                          </button>
                          {index < value.length - 1 && (
                            <span className={SYNTAX_COLORS.comma}>,</span>
                          )}
                        </div>
                      )
                    }
                  </div>
                ))
              : Object.entries(value).map(([k, v], index, arr) => (
                  <div key={k}>
                    {renderJsonField(k, v, depth + 1, currentPath)}
                    {index < arr.length - 1 && (
                      <span className={SYNTAX_COLORS.comma}>,</span>
                    )}
                  </div>
                ))
            }
          </div>
          <div className={isExpanded ? 'block py-0.5' : 'hidden'}>
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
        <span className={SYNTAX_COLORS.string}>
          {typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}
        </span>
        {typeof value === 'string' && value !== '' && (
          <button
            onClick={(e) => handleDelete(currentPath, e)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded ml-2
                     transition-opacity focus:opacity-100 focus:outline-none
                     focus:ring-1 focus:ring-red-500"
            aria-label={`Remove ${key} annotation`}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-300" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-800">
      {/* Header */}
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

      {/* JSON Content */}
      <div 
        className="p-4 text-sm overflow-auto max-h-[calc(100vh-24rem)] font-mono
                   scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        role="region"
        aria-label="JSON content viewer"
      >
        <div className={SYNTAX_COLORS.bracket}>{'{'}</div>
        <div className="ml-4">
          {Object.entries(data).map(([key, value], index, arr) => (
            <React.Fragment key={key}>
              {renderJsonField(key, value, 1)}
              {index < arr.length - 1 && (
                <span className={SYNTAX_COLORS.comma}>,</span>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className={SYNTAX_COLORS.bracket}>{'}'}</div>
      </div>
    </div>
  );
};

export default JsonViewer;