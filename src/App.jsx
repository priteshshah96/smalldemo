import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  ChevronDown, 
  ChevronUp,
  HelpCircle,
  Info 
} from 'lucide-react';
import TextAnnotationPanel from './components/TextAnnotationPanel';
import JsonViewer from './components/JsonViewer';
import TutorialDialog from './components/TutorialDialog';
import WarningBanner from './components/WarningBanner';
const App = () => {
  // Core state
  const [jsonData, setJsonData] = useState(null);
  const [currentPaperIndex, setCurrentPaperIndex] = useState(0);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [selectedText, setSelectedText] = useState(null);
  const [isFileDropActive, setIsFileDropActive] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [isAbstractOpen, setIsAbstractOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Helper function to open annotation guide PDF
  const openAnnotationGuide = () => {
    window.open('/docs/annotation_guide.pdf', '_blank');
  };

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedText) {
          setSelectedText(null);
        }
        if (showTutorial) {
          setShowTutorial(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedText, showTutorial]);
  // File Upload UI
  const FileUploadView = () => (
    <div 
      className={`min-h-screen bg-gray-50 p-8 flex items-center justify-center
                 ${isFileDropActive ? 'bg-blue-50' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsFileDropActive(true);
      }}
      onDragLeave={() => setIsFileDropActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsFileDropActive(false);
        const file = e.dataTransfer.files[0];
        if (file) {
          handleFileInput({ target: { files: [file] } });
        }
      }}
    >
      <div className="max-w-xl w-full">
        <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors
                       ${isFileDropActive ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}`}>
          <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" aria-hidden="true" />
          <h2 className="text-xl font-semibold mb-2">Upload Annotation File</h2>
          <p className="text-gray-500 mb-4">Drag and drop your JSON file here or click to browse</p>
          <input
            type="file"
            accept=".json"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg 
                     hover:bg-blue-700 cursor-pointer transition-colors"
          >
            Browse Files
          </label>
        </div>
      </div>
    </div>
  );

  // Error UI
  const ErrorView = () => (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <X className="w-8 h-8 text-red-500" aria-hidden="true" />
          <h2 className="text-red-600 text-xl font-bold">Error Occurred</h2>
        </div>
        <p className="text-gray-700 mb-6">{error}</p>
        <button
          onClick={() => setError('')}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 
                   transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <span>Try Again</span>
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  // Handle file input
  const handleFileInput = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        validateAndSetData(data);
      } catch (e) {
        setError('Invalid JSON file. Please check the format.');
      }
    }
  };

  const validateAndSetData = (data) => {
    if (!Array.isArray(data)) {
      setError('Invalid format: Expected an array of papers');
      return;
    }
    
    const isValid = data.every(paper => 
      paper.paper_code && 
      Array.isArray(paper.events)
    );

    if (!isValid) {
      setError('Invalid format: Each paper must have paper_code and events array');
      return;
    }

    setJsonData(data);
    setError('');
  };

  // Handle text selection
  const handleTextSelect = (selection) => {
    setSelectedText(selection);
  };

  // Handle annotation selection with multiple span support
  const handleAnnotationSelect = (annotationType) => {
    if (!selectedText || !jsonData) return;

    const newData = [...jsonData];
    const currentEvent = newData[currentPaperIndex].events[currentEventIndex];

    // Function to handle array of spans
    const addSpanToArray = (existingValue, newSpan) => {
      if (!existingValue) return [newSpan];
      if (typeof existingValue === 'string') return [existingValue, newSpan];
      return [...existingValue, newSpan];
    };

    if (annotationType.startsWith('Object.')) {
      const [_, subType] = annotationType.split('.');
      if (!currentEvent.Arguments) {
        currentEvent.Arguments = {};
      }
      if (!currentEvent.Arguments.Object) {
        currentEvent.Arguments.Object = {};
      }
      currentEvent.Arguments.Object[subType.replace('_', ' ')] = 
        addSpanToArray(currentEvent.Arguments.Object[subType.replace('_', ' ')], selectedText.text);
    } else if (annotationType === 'Main_Action') {
      currentEvent['Main Action'] = 
        addSpanToArray(currentEvent['Main Action'], selectedText.text);
    } else {
      if (!currentEvent.Arguments) {
        currentEvent.Arguments = {};
      }
      currentEvent.Arguments[annotationType] = 
        addSpanToArray(currentEvent.Arguments[annotationType], selectedText.text);
    }

    setJsonData(newData);
    setSelectedText(null);
    setLastSaved(new Date());
  };

  // Handle annotation removal with multi-span support
  // Define the default structure
  const DEFAULT_ARGUMENTS_STRUCTURE = {
    Object: {
      'Base Object': '',
      'Base Modifier': '',
      'Attached Object': '',
      'Attached Modifier': ''
    },
    Agent: '',
    Context: '',
    Purpose: '',
    Method: '',
    Results: '',
    Analysis: '',
    Challenge: '',
    Ethical: '',
    Implications: '',
    Contradictions: ''
  };
  
  const EVENT_TYPES = [
    'Background/Introduction',
    'Methods/Approach',
    'Results/Findings',
    'Conclusions/Implications'
  ];
  
  const handleAnnotationRemove = (path) => {
    console.log('Removing annotation at path:', path);
    
    const newData = [...jsonData];
    const currentEvent = newData[currentPaperIndex].events[currentEventIndex];
    
    // Handle event type summaries (e.g., Background/Introduction)
    if (EVENT_TYPES.includes(path)) {
      currentEvent[path] = '';
      setJsonData([...newData]);
      setLastSaved(new Date());
      return;
    }
    
    const pathParts = path.split('.');
    
    // Handle Main Action directly
    if (pathParts[0] === 'Main Action') {
      if (pathParts.length === 2) {
        // Handle array item deletion
        const index = parseInt(pathParts[1]);
        if (!isNaN(index)) {
          const mainAction = Array.isArray(currentEvent['Main Action']) 
            ? [...currentEvent['Main Action']]
            : [currentEvent['Main Action']];
            
          mainAction.splice(index, 1);
          currentEvent['Main Action'] = mainAction.length === 0 ? '' : 
                                      mainAction.length === 1 ? mainAction[0] : mainAction;
        }
      } else {
        currentEvent['Main Action'] = '';
      }
      
      setJsonData([...newData]);
      setLastSaved(new Date());
      return;
    }
    
    // Handle Arguments
    if (pathParts[0] === 'Arguments') {
      // Ensure Arguments exists with default structure
      if (!currentEvent.Arguments) {
        currentEvent.Arguments = {...DEFAULT_ARGUMENTS_STRUCTURE};
      }
      
      let current = currentEvent.Arguments;
      
      // Handle Object type arguments
      if (pathParts[1] === 'Object' && pathParts.length > 2) {
        // Ensure Object exists with default structure
        if (!current.Object) {
          current.Object = {
            'Base Object': '',
            'Base Modifier': '',
            'Attached Object': '',
            'Attached Modifier': ''
          };
        }
        
        const objectKey = pathParts[2];
        if (pathParts.length === 4) {
          // Handle array item deletion
          const index = parseInt(pathParts[3]);
          if (!isNaN(index) && current.Object[objectKey]) {
            const spans = Array.isArray(current.Object[objectKey]) 
              ? [...current.Object[objectKey]]
              : [current.Object[objectKey]];
              
            spans.splice(index, 1);
            current.Object[objectKey] = spans.length === 0 ? '' : 
                                      spans.length === 1 ? spans[0] : spans;
          }
        } else {
          // Set to empty string instead of deleting
          current.Object[objectKey] = '';
        }
      } else {
        // Handle regular Arguments
        const argKey = pathParts[1];
        if (pathParts.length === 3) {
          // Handle array item deletion
          const index = parseInt(pathParts[2]);
          if (!isNaN(index) && current[argKey]) {
            const spans = Array.isArray(current[argKey]) 
              ? [...current[argKey]]
              : [current[argKey]];
              
            spans.splice(index, 1);
            current[argKey] = spans.length === 0 ? '' : 
                             spans.length === 1 ? spans[0] : spans;
          }
        } else {
          // Set to empty string instead of deleting
          current[argKey] = '';
        }
      }
    }
    
    setJsonData([...newData]);
    setLastSaved(new Date());
  };

const handleSummaryChange = (event) => {
  const newData = [...jsonData];
  const currentEvent = newData[currentPaperIndex].events[currentEventIndex];
  const eventType = Object.keys(currentEvent).find(key => 
    ['Background/Introduction', 'Methods/Approach', 'Results/Findings', 'Conclusions/Implications'].includes(key)
  );
  if (eventType) {
    currentEvent[eventType] = event.target.value;
  }
  setJsonData(newData);
  setLastSaved(new Date());
};
  // Get annotations for highlighting
  const getAnnotationsForHighlighting = () => {
    if (!jsonData) return [];
    
    const currentEvent = jsonData[currentPaperIndex].events[currentEventIndex];
    const highlights = [];

    // Helper function to process spans
    const processSpans = (spans, type, path) => {
      if (!spans) return;
      const spanArray = typeof spans === 'string' ? [spans] : spans;
      
      spanArray.forEach((span, index) => {
        const start = currentEvent.Text.indexOf(span);
        if (start !== -1) {
          highlights.push({
            start,
            end: start + span.length,
            type,
            text: span,
            path: `${path}${Array.isArray(spans) ? `.${index}` : ''}`
          });
        }
      });
    };

    // Process Main Action
    processSpans(currentEvent['Main Action'], 'Main_Action', 'Main Action');

    // Process Arguments
    if (currentEvent.Arguments) {
      Object.entries(currentEvent.Arguments).forEach(([type, value]) => {
        if (type === 'Object') {
          Object.entries(value).forEach(([subType, subValue]) => {
            processSpans(
              subValue,
              `Object.${subType.replace(' ', '_')}`,
              `Arguments.Object.${subType}`
            );
          });
        } else {
          processSpans(value, type, `Arguments.${type}`);
        }
      });
    }

    return highlights;
  };

  // Handle JSON download
  const handleDownload = () => {
  if (!jsonData || !jsonData[currentPaperIndex]) return;
  
    const originalName = jsonData[currentPaperIndex].paper_code || 'annotated_data';
    const fileName = `${originalName}_annotated.json`;
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  // Shows appropriate view based on state
  // Main render
  if (error) return <ErrorView />;
  if (!jsonData) return <FileUploadView />;

  const currentEvent = jsonData[currentPaperIndex].events[currentEventIndex];
  const eventType = Object.keys(currentEvent).find(key => 
    ['Background/Introduction', 'Methods/Approach', 'Results/Findings', 'Conclusions/Implications'].includes(key)
  );

  const isLastEvent = currentEventIndex === jsonData[currentPaperIndex].events.length - 1 &&
                     currentPaperIndex === jsonData.length - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <TutorialDialog isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-20">
        {/* Warning Banner */}
        <WarningBanner />
        
        <div className="max-w-[95%] mx-auto p-4">
          <div className="flex justify-between items-center mb-2">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">
                {jsonData[currentPaperIndex].paper_code}
              </h1>
              {lastSaved && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Save className="w-4 h-4" />
                  Last saved: {new Intl.DateTimeFormat('en-US', {
                    hour: 'numeric',
                    minute: 'numeric',
                  }).format(lastSaved)}
                </span>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Help Icons */}
              <div className="flex items-center gap-3 mr-4">
                <button
                  onClick={openAnnotationGuide}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="View annotation guide"
                >
                  <Info className="w-5 h-5 text-blue-600" />
                </button>
                <button
                  onClick={() => setShowTutorial(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="View tutorial"
                >
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                </button>
              </div>

              {/* Progress indicators */}
              <span className="text-sm font-medium text-gray-600">
                Paper {currentPaperIndex + 1} of {jsonData.length}
              </span>
              <span className="text-lg font-bold text-blue-600">
                Event {currentEventIndex + 1} of {jsonData[currentPaperIndex].events.length}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden w-full">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ 
                width: `${((currentPaperIndex * jsonData[currentPaperIndex].events.length + currentEventIndex) / 
                (jsonData.length * jsonData[currentPaperIndex].events.length)) * 100}%` 
              }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-24 pb-32 px-4">
        <div className="max-w-[95%] mx-auto space-y-6">
          {/* Abstract Section - Full Width */}
          {jsonData[currentPaperIndex].abstract && (
            <div className="w-full bg-white rounded-xl shadow-lg">
              <button
                onClick={() => setIsAbstractOpen(!isAbstractOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-t-xl"
                aria-expanded={isAbstractOpen}
                aria-controls="abstract-content"
              >
                <h2 className="text-xl font-semibold text-gray-900">Abstract</h2>
                {isAbstractOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" aria-hidden="true" />
                )}
              </button>
              <div
                id="abstract-content"
                className={`transition-all duration-300 ${
                  isAbstractOpen ? 'max-h-96 overflow-y-auto' : 'max-h-0 overflow-hidden'
                }`}
              >
                <div className="p-6 border-t border-gray-100">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {jsonData[currentPaperIndex].abstract}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Text Annotation Panel */}
            <div className="col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Event Type: <span className="text-blue-600">{eventType}</span>
                  </h2>
                </div>
                <TextAnnotationPanel
                  text={currentEvent.Text}
                  annotations={getAnnotationsForHighlighting()}
                  onTextSelect={handleTextSelect}
                  onAnnotationSelect={handleAnnotationSelect}
                  selectedText={selectedText}
                />
              </div>
            </div>

            {/* Right Column: Summarization + JSON Viewer */}
            <div className="col-span-1 space-y-4">
              {/* Summarization Box */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-2">Summarization</h3>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg h-12 resize-none text-sm"
                  placeholder="Add a brief summary (max 10 words)..."
                  value={currentEvent[eventType] || ''}
                  onChange={handleSummaryChange}
                  aria-label="Event summary"
                  maxLength={100}
                />
              </div>

              {/* JSON Viewer */}
              <div className="flex-1">
                <JsonViewer 
                  data={currentEvent} 
                  onDownload={handleDownload}
                  onRemoveAnnotation={handleAnnotationRemove}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Navigation with Finish button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg py-4 z-50">
        <div className="max-w-[95%] mx-auto flex justify-center gap-4">
          <button
            className="px-4 sm:px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 
                     disabled:opacity-50 transition-colors duration-200 flex items-center gap-2 w-[100px] sm:w-[120px] justify-center"
            onClick={() => {
              if (currentEventIndex > 0) {
                setCurrentEventIndex(prev => prev - 1);
              } else if (currentPaperIndex > 0) {
                setCurrentPaperIndex(prev => prev - 1);
                setCurrentEventIndex(jsonData[currentPaperIndex - 1].events.length - 1);
              }
            }}
            disabled={currentEventIndex === 0 && currentPaperIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {isLastEvent ? (
            <button
              onClick={handleDownload}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                       transition-colors duration-200 flex items-center gap-2"
            >
              Finish
              <Save className="w-5 h-5" />
            </button>
          ) : (
            <button
              className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       transition-colors duration-200 flex items-center gap-2 w-[100px] sm:w-[120px] justify-center"
              onClick={() => {
                if (currentEventIndex < jsonData[currentPaperIndex].events.length - 1) {
                  setCurrentEventIndex(prev => prev + 1);
                } else if (currentPaperIndex < jsonData.length - 1) {
                  setCurrentPaperIndex(prev => prev + 1);
                  setCurrentEventIndex(0);
                }
              }}
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;