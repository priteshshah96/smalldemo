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

// Constants
const DEFAULT_EVENT_STRUCTURE = {
  'Background/Introduction': '',
  'Methods/Approach': '',
  'Results/Findings': '',
  'Conclusions/Implications': '',
  'Text': '',
  'Main Action': '',
  'Arguments': {
    'Agent': '',
    'Object': {
      'Base Object': '',
      'Base Modifier': '',
      'Attached Object': '',
      'Attached Modifier': ''
    },
    'Context': '',
    'Purpose': '',
    'Method': '',
    'Results': '',
    'Analysis': '',
    'Challenge': '',
    'Ethical': '',
    'Implications': '',
    'Contradictions': ''
  }
};

const EVENT_TYPES = [
  'Background/Introduction',
  'Methods/Approach',
  'Results/Findings',
  'Conclusions/Implications'
];

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
  const [originalFileName, setOriginalFileName] = useState('');

  // Helper function to open annotation guide PDF
  const openAnnotationGuide = () => {
    window.open('/docs/annotation_guide.pdf', '_blank');
  };

  // Calculate total progress
  const calculateProgress = () => {
    if (!jsonData) return 0;
    const totalEvents = jsonData.reduce((sum, paper) => sum + paper.events.length, 0);
    const currentTotalEvents = jsonData.slice(0, currentPaperIndex).reduce((sum, paper) => sum + paper.events.length, 0);
    return Math.min(((currentTotalEvents + currentEventIndex + 1) / totalEvents) * 100, 100);
  };

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedText(null);
        setShowTutorial(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle file input
  const handleFileInput = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        setOriginalFileName(file.name.replace('.json', ''));
        const text = await file.text();
        const data = JSON.parse(text);
        validateAndSetData(data);
      } catch (e) {
        setError('Invalid JSON file. Please check the format.');
      }
    }
  };

  // Validate and set data with proper structure
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

    // Initialize proper structure for each event
    const structuredData = data.map(paper => ({
      ...paper,
      events: paper.events.map(event => {
        // Find which event type this is
        const eventType = EVENT_TYPES.find(type => event[type] !== undefined);
        
        // Create base structure WITHOUT event types
        const baseStructure = {
          Text: event.Text || '',
          'Main Action': event['Main Action'] || '',
          Arguments: {
            Agent: '',
            Object: {
              'Base Object': '',
              'Base Modifier': '',
              'Attached Object': '',
              'Attached Modifier': ''
            },
            Context: '',
            Purpose: '',
            Method: '',
            Results: '',
            Analysis: '',
            Challenge: '',
            Ethical: '',
            Implications: '',
            Contradictions: ''
          }
        };

        // Only add the specific event type that's present
        if (eventType) {
          baseStructure[eventType] = event[eventType] || '';
        }

        // Handle Arguments structure if present
        if (event.Arguments) {
          baseStructure.Arguments = {
            ...baseStructure.Arguments,
            ...event.Arguments,
            Object: {
              ...baseStructure.Arguments.Object,
              ...(event.Arguments.Object || {})
            }
          };
        }

        return baseStructure;
      })
    }));

    setJsonData(structuredData);
    setError('');
  };

  // Handle text selection
  const handleTextSelect = (selection) => {
    setSelectedText(selection);
  };

  // Handle annotation selection
  const handleAnnotationSelect = (annotationType) => {
    if (!selectedText || !jsonData) return;

    const newData = [...jsonData];
    const currentEvent = newData[currentPaperIndex].events[currentEventIndex];
    
    // Ensure Arguments structure exists
    if (!currentEvent.Arguments) {
      currentEvent.Arguments = {
        Agent: '',
        Object: {
          'Base Object': '',
          'Base Modifier': '',
          'Attached Object': '',
          'Attached Modifier': ''
        },
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
    }

    // Helper function to handle array of spans
    const addSpanToArray = (existingValue, newSpan) => {
      if (!existingValue) return [newSpan];
      if (typeof existingValue === 'string') return [existingValue, newSpan];
      return [...existingValue, newSpan];
    };

    if (annotationType.startsWith('Object.')) {
      const [_, subType] = annotationType.split('.');
      const objectKey = subType.replace('_', ' ');
      
      // Initialize Arguments.Object if it doesn't exist or is a string
      if (!currentEvent.Arguments.Object || typeof currentEvent.Arguments.Object === 'string') {
        currentEvent.Arguments.Object = {
          'Base Object': '',
          'Base Modifier': '',
          'Attached Object': '',
          'Attached Modifier': ''
        };
      }

      if (!currentEvent.Arguments.Object[objectKey]) {
        currentEvent.Arguments.Object[objectKey] = selectedText.text;
      } else {
        currentEvent.Arguments.Object[objectKey] = 
          addSpanToArray(currentEvent.Arguments.Object[objectKey], selectedText.text);
      }
    } else if (annotationType === 'Main_Action') {
      currentEvent['Main Action'] = selectedText.text;
    } else {
      currentEvent.Arguments[annotationType] = 
        addSpanToArray(currentEvent.Arguments[annotationType], selectedText.text);
    }

    setJsonData(newData);
    setSelectedText(null);
    setLastSaved(new Date());
  };

  // Handle annotation removal
  const handleAnnotationRemove = (path) => {
    const newData = [...jsonData];
    const currentEvent = newData[currentPaperIndex].events[currentEventIndex];
    
    if (EVENT_TYPES.includes(path)) {
      currentEvent[path] = '';
    } else if (path === 'Main Action') {
      currentEvent['Main Action'] = '';
    } else if (path.startsWith('Arguments.')) {
      const pathParts = path.split('.');
  
      // Handle Object subfields (e.g., Arguments.Object.Base_Object)
      if (path.startsWith('Arguments.Object.')) {
        const objectKey = pathParts[2];  // e.g., "Base Object"
        const itemIndex = parseInt(pathParts[3]);  // Array index if it exists
  
        // Always ensure Object has proper structure
        if (!currentEvent.Arguments.Object || typeof currentEvent.Arguments.Object !== 'object') {
          currentEvent.Arguments.Object = {
            'Base Object': '',
            'Base Modifier': '',
            'Attached Object': '',
            'Attached Modifier': ''
          };
        }
  
        // Handle array item deletion or reset field
        if (!isNaN(itemIndex)) {
          let currentValue = currentEvent.Arguments.Object[objectKey];
          if (Array.isArray(currentValue)) {
            currentValue = currentValue.filter((_, i) => i !== itemIndex);
            currentEvent.Arguments.Object[objectKey] = 
              currentValue.length === 0 ? '' : 
              currentValue.length === 1 ? currentValue[0] : currentValue;
          }
        } else {
          currentEvent.Arguments.Object[objectKey] = '';
        }
      } else {
        // Handle other Arguments fields
        const argumentType = pathParts[1];
        const index = parseInt(pathParts[2]);
  
        if (!isNaN(index)) {
          // Handle array item deletion
          let currentValue = currentEvent.Arguments[argumentType];
          if (Array.isArray(currentValue)) {
            currentValue = currentValue.filter((_, i) => i !== index);
            currentEvent.Arguments[argumentType] = 
              currentValue.length === 0 ? '' : 
              currentValue.length === 1 ? currentValue[0] : currentValue;
          }
        } else if (argumentType === 'Object') {
          // Reset Object structure but keep it as an object
          currentEvent.Arguments.Object = {
            'Base Object': '',
            'Base Modifier': '',
            'Attached Object': '',
            'Attached Modifier': ''
          };
        } else {
          // Reset simple argument field
          currentEvent.Arguments[argumentType] = '';
        }
      }
  
      // Ensure Arguments structure always exists with proper shape
      if (!currentEvent.Arguments) {
        currentEvent.Arguments = {
          Agent: '',
          Object: {
            'Base Object': '',
            'Base Modifier': '',
            'Attached Object': '',
            'Attached Modifier': ''
          },
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
      }
    }
  
    setJsonData([...newData]);
    setLastSaved(new Date());
  };

  // Handle summary change
  const handleSummaryChange = (event) => {
    const newData = [...jsonData];
    const currentEvent = newData[currentPaperIndex].events[currentEventIndex];
    const eventType = EVENT_TYPES.find(type => currentEvent[type] !== undefined);
    
    if (eventType) {
      currentEvent[eventType] = event.target.value;
      setJsonData(newData);
      setLastSaved(new Date());
    }
  };

  // Get annotations for highlighting
  const getAnnotationsForHighlighting = () => {
    if (!jsonData) return [];
    
    const currentEvent = jsonData[currentPaperIndex].events[currentEventIndex];
    const highlights = [];

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

    processSpans(currentEvent['Main Action'], 'Main_Action', 'Main Action');

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
    if (!jsonData) return;
    
    const fileName = `${originalFileName || 'annotated_data'}_annotated.json`;
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

  // Show appropriate view based on state
  if (error) {
    return <ErrorView error={error} onClose={() => setError('')} />;
  }
  
  if (!jsonData) {
    return (
      <FileUploadView 
        isFileDropActive={isFileDropActive}
        setIsFileDropActive={setIsFileDropActive}
        handleFileInput={handleFileInput}
      />
    );
  }

  const currentEvent = jsonData[currentPaperIndex].events[currentEventIndex];
  const eventType = EVENT_TYPES.find(type => currentEvent[type] !== undefined);
  const isLastEvent = currentEventIndex === jsonData[currentPaperIndex].events.length - 1 &&
                     currentPaperIndex === jsonData.length - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <TutorialDialog isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-20">
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
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-24 pb-32 px-4">
        <div className="max-w-[95%] mx-auto space-y-6">
          {/* Abstract Section */}
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
                  key={`${currentPaperIndex}-${currentEventIndex}`}
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

// File Upload Component
const FileUploadView = ({ isFileDropActive, setIsFileDropActive, handleFileInput }) => (
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

// Error Component
const ErrorView = ({ error, onClose }) => (
  <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
    <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
      <div className="flex items-center gap-3 mb-4">
        <X className="w-8 h-8 text-red-500" aria-hidden="true" />
        <h2 className="text-red-600 text-xl font-bold">Error Occurred</h2>
      </div>
      <p className="text-gray-700 mb-6">{error}</p>
      <button
        onClick={onClose}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 
                 transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <span>Try Again</span>
        <ChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  </div>
);

export default App;