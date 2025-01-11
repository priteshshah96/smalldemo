import React, { useState, useEffect } from 'react';
import { Download, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

const JsonViewer = ({ data, onDownload, onRemoveAnnotation }) => {
  // Initialize with all important paths expanded
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

  // Auto-expand paths with non-empty values
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

  // Helper function to handle deletion
  const handleDelete = (path, e) => {
    e.stopPropagation(); // Prevent event bubbling
    e.preventDefault();
    
    // Format the path correctly
    const pathArray = path.split('.');
    const formattedPath = pathArray.map(part => {
      return !isNaN(part) ? parseInt(part) : part;
    }).join('.');
    
    console.log('Deleting path:', formattedPath);
    
    // Only proceed if there's a path and delete handler
    if (formattedPath && onRemoveAnnotation) {
      onRemoveAnnotation(formattedPath);
      
      // Ensure the UI updates by toggling the relevant path's expansion
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
        <div key={key} className="group">
          <div 
            className="flex items-start cursor-pointer hover:bg-gray-800 rounded px-1"
            onClick={() => togglePath(currentPath)}
            role="button"
            aria-expanded={isExpanded}
            aria-label={`Toggle ${key} section`}
          >
            <span className="text-gray-400 w-4">
              {isExpanded ? 
                <ChevronDown className="w-4 h-4" aria-hidden="true" /> : 
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              }
            </span>
            <span className="text-yellow-400">{indent}"{key}"</span>
            <span className="text-white">: {Array.isArray(value) ? '[' : '{'}</span>
          </div>
          <div className={`ml-4 ${isExpanded ? 'block' : 'hidden'}`}>
            {Array.isArray(value) 
              ? value.map((item, index) => (
                  <div key={index} className="group">
                    {typeof item === 'object' 
                      ? renderJsonField(index, item, depth + 1, currentPath)
                      : (
                        <div className="flex items-center gap-2 group">
                          <span className="text-green-400">{indent}  "{item}"</span>
                          <button
                            onClick={(e) => handleDelete(`${currentPath}.${index}`, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded 
                                     transition-opacity focus:opacity-100"
                            aria-label={`Remove ${item} annotation`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      )
                    }
                    {index < value.length - 1 && ','}
                  </div>
                ))
              : Object.entries(value).map(([k, v], index, arr) => (
                  <div key={k}>
                    {renderJsonField(k, v, depth + 1, currentPath)}
                    {index < arr.length - 1 && ','}
                  </div>
                ))
            }
          </div>
          <div className={isExpanded ? 'block' : 'hidden'}>
            <span className="text-white">{indent}{Array.isArray(value) ? ']' : '}'}</span>
          </div>
        </div>
      );
    }

    return (
      <div key={key} className="flex items-center group">
        <span className="text-yellow-400">{indent}"{key}"</span>
        <span className="text-white">: </span>
        <span className="text-green-400">
          {typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}
        </span>
        {typeof value === 'string' && value !== '' && (
          <button
            onClick={(e) => handleDelete(currentPath, e)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded ml-2
                     transition-opacity focus:opacity-100"
            aria-label={`Remove ${key} annotation`}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
        <h3 className="text-white font-medium">JSON Output</h3>
        <button
          onClick={onDownload}
          className="p-2 hover:bg-gray-700 rounded transition-colors focus:outline-none 
                   focus:ring-2 focus:ring-blue-500"
          title="Download JSON"
          aria-label="Download JSON file"
        >
          <Download className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* JSON Content */}
      <div 
        className="p-4 font-mono text-sm overflow-auto max-h-[calc(100vh-24rem)]"
        role="region"
        aria-label="JSON content viewer"
      >
        <div className="text-white">{'{'}</div>
        <div className="ml-4">
          {Object.entries(data).map(([key, value], index, arr) => (
            <React.Fragment key={key}>
              {renderJsonField(key, value, 1)}
              {index < arr.length - 1 && ','}
            </React.Fragment>
          ))}
        </div>
        <div className="text-white">{'}'}</div>
      </div>
    </div>
  );
};

export default JsonViewer;