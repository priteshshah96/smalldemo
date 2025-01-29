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
  Info,
} from 'lucide-react';
import TextAnnotationPanel from './components/TextAnnotationPanel';
import JsonViewer from './components/JsonViewer';
import TutorialDialog from './components/TutorialDialog';
import WarningBanner from './components/WarningBanner';
import { prepareDataForDownload,  annotationStore } from './components/TextAnnotationUtils';

// Constants
const DEFAULT_EVENT_STRUCTURE = {
  'Background/Introduction': '',
  'Methods/Approach': '',
  'Results/Findings': '',
  'Conclusions/Implications': '',
  Text: '',
  'Main Action': '',
  Arguments: {
    Agent: '',
    Object: {
      'Primary Object': '',
      'Primary Modifier': '',
      'Secondary Object': '',
      'Secondary Modifier': '',
    },
    Context: '',
    Purpose: '',
    Method: '',
    Results: '',
    Analysis: '',
    Challenge: '',
    Ethical: '',
    Implications: '',
    Contradictions: '',
  },
};

const EVENT_TYPES = [
  'Background/Introduction',
  'Methods/Approach',
  'Results/Findings',
  'Conclusions/Implications',
];

const App = () => {
  // Core state
  const [jsonData, setJsonData] = useState(null);
  const [currentPaperIndex, setCurrentPaperIndex] = useState(0);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isFileDropActive, setIsFileDropActive] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [isAbstractOpen, setIsAbstractOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [originalFileName, setOriginalFileName] = useState('');
  const [currentSelection, setCurrentSelection] = useState(null);

  // Helper function to open annotation guide PDF
  const openAnnotationGuide = () => {
    window.open('/docs/annotation_guide.pdf', '_blank');
  };

  // Calculate total progress
  const calculateProgress = () => {
    if (!jsonData) return 0;
    const totalEvents = jsonData.reduce((sum, paper) => sum + paper.events.length, 0);
    const currentTotalEvents = jsonData
      .slice(0, currentPaperIndex)
      .reduce((sum, paper) => sum + paper.events.length, 0);
    return Math.min(((currentTotalEvents + currentEventIndex + 1) / totalEvents) * 100, 100);
  };

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
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
  
    const isValid = data.every((paper) => paper.paper_code && Array.isArray(paper.events));
  
    if (!isValid) {
      setError('Invalid format: Each paper must have paper_code and events array');
      return;
    }
  
    const structuredData = data.map((paper) => ({
      ...paper,
      events: paper.events.map((event) => {
        // Create a base structure with only the fields that exist in the event
        const baseStructure = {
          'Main Action': '', // Ensure Main Action is always present, even if empty
          ...event, // Spread existing fields
        };
  
        // Add the event type and text if they exist
        EVENT_TYPES.forEach((type) => {
          if (event[type] !== undefined) {
            baseStructure[type] = event[type] || '';
          }
        });
  
        // Add the Text field if it exists
        if (event.Text !== undefined) {
          baseStructure.Text = event.Text || '';
        }
  
        // Handle existing annotations
        if (event['Main Action']) {
          baseStructure['Main Action'] = event['Main Action'];
        }
        if (event.Arguments) {
          baseStructure.Arguments = {
            ...(baseStructure.Arguments || {}),
            ...event.Arguments,
            Object: {
              ...(baseStructure.Arguments?.Object || {}),
              ...(event.Arguments.Object || {}),
            },
          };
        }
  
        // Initialize annotations array if it doesn't exist
        if (!baseStructure.annotations) {
          baseStructure.annotations = [];
        }
  
        return baseStructure;
      }),
    }));
  
    setJsonData(structuredData);
    setError('');
  };

  // Handle annotation selection from TextAnnotationPanel
  const handleAnnotationUpdate = (annotationType, annotationId) => {
    if (!jsonData || !currentSelection) {
      console.error('No text selected or JSON data is missing.');
      return;
    }

    const newData = [...jsonData];
    const currentEvent = newData[currentPaperIndex].events[currentEventIndex];

    // Initialize annotations array if it doesn't exist
    if (!currentEvent.annotations) {
      currentEvent.annotations = [];
    }

    // Add the annotation to the annotations array
    currentEvent.annotations.push({
      id: annotationId,
      type: annotationType,
      start: currentSelection.start,
      end: currentSelection.end,
    });

    // Update the Main Action or Arguments field
    if (annotationType === 'Main_Action') {
      currentEvent['Main Action'] = annotationId; // Ensure this is the ID, not the object
    } else if (annotationType.startsWith('Object.')) {
      const [_, subType] = annotationType.split('.');
      const objectKey = subType.replace('_', ' ');

      if (!currentEvent.Arguments.Object[objectKey]) {
        currentEvent.Arguments.Object[objectKey] = annotationId;
      } else {
        const currentValue = currentEvent.Arguments.Object[objectKey];
        currentEvent.Arguments.Object[objectKey] = Array.isArray(currentValue)
          ? [...currentValue, annotationId]
          : [currentValue, annotationId];
      }
    } else {
      if (!currentEvent.Arguments[annotationType]) {
        currentEvent.Arguments[annotationType] = annotationId;
      } else {
        const currentValue = currentEvent.Arguments[annotationType];
        currentEvent.Arguments[annotationType] = Array.isArray(currentValue)
          ? [...currentValue, annotationId]
          : [currentValue, annotationId];
      }
    }

    setJsonData(newData);
    setLastSaved(new Date());
  };

  // Handle annotation removal
  const handleAnnotationRemove = (path) => {
    const newData = [...jsonData];
    const currentEvent = newData[currentPaperIndex].events[currentEventIndex];
  
    if (path === 'Main Action') {
      // Remove the annotation from the annotations array
      currentEvent.annotations = currentEvent.annotations.filter(
        (ann) => ann.id !== currentEvent['Main Action']
      );
      currentEvent['Main Action'] = '';
    } else if (path.startsWith('Arguments.')) {
      const pathParts = path.split('.');
  
      if (path.startsWith('Arguments.Object.')) {
        const objectKey = pathParts[2];
        const itemIndex = parseInt(pathParts[3]);
  
        if (!isNaN(itemIndex)) {
          let currentValue = currentEvent.Arguments.Object[objectKey];
          if (Array.isArray(currentValue)) {
            // Remove the annotation ID from the annotations array
            const annotationId = currentValue[itemIndex];
            currentEvent.annotations = currentEvent.annotations.filter(
              (ann) => ann.id !== annotationId
            );
  
            // Update the Arguments.Object field
            currentValue = currentValue.filter((_, i) => i !== itemIndex);
            currentEvent.Arguments.Object[objectKey] =
              currentValue.length === 0
                ? ''
                : currentValue.length === 1
                ? currentValue[0]
                : currentValue;
          }
        } else {
          // Remove the annotation ID from the annotations array
          const annotationId = currentEvent.Arguments.Object[objectKey];
          currentEvent.annotations = currentEvent.annotations.filter(
            (ann) => ann.id !== annotationId
          );
  
          // Clear the Arguments.Object field
          currentEvent.Arguments.Object[objectKey] = '';
        }
      } else {
        const argumentType = pathParts[1];
        const index = parseInt(pathParts[2]);
  
        if (!isNaN(index)) {
          let currentValue = currentEvent.Arguments[argumentType];
          if (Array.isArray(currentValue)) {
            // Remove the annotation ID from the annotations array
            const annotationId = currentValue[index];
            currentEvent.annotations = currentEvent.annotations.filter(
              (ann) => ann.id !== annotationId
            );
  
            // Update the Arguments field
            currentValue = currentValue.filter((_, i) => i !== index);
            currentEvent.Arguments[argumentType] =
              currentValue.length === 0
                ? ''
                : currentValue.length === 1
                ? currentValue[0]
                : currentValue;
          }
        } else {
          // Remove the annotation ID from the annotations array
          const annotationId = currentEvent.Arguments[argumentType];
          currentEvent.annotations = currentEvent.annotations.filter(
            (ann) => ann.id !== annotationId
          );
  
          // Clear the Arguments field
          currentEvent.Arguments[argumentType] = '';
        }
      }
    }
  
    // Update the state to trigger a re-render
    setJsonData([...newData]);
    setLastSaved(new Date());
  };

  // Handle summary change
  const handleSummaryChange = (event) => {
    const newData = [...jsonData];
    const currentEvent = newData[currentPaperIndex].events[currentEventIndex];
    const eventType = EVENT_TYPES.find((type) => currentEvent[type] !== undefined);

    if (eventType) {
      currentEvent[eventType] = event.target.value;
      setJsonData(newData);
      setLastSaved(new Date());
    }
  };

  // Handle JSON download
  const handleDownload = () => {
    if (!jsonData) return;
  
    // Prepare the data for download using the updated prepareDataForDownload function
    const downloadData = jsonData.map((paper) => ({
      ...paper,
      events: paper.events.map((event) => {
        const resolvedEvent = prepareDataForDownload(event);
        return resolvedEvent;
      }),
    }));
  
    // Trigger the download
    const fileName = `${originalFileName || 'annotated_data'}_annotated.json`;
    const blob = new Blob([JSON.stringify(downloadData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle selection update from TextAnnotationPanel
  const handleSelectionUpdate = (selection) => {
    setCurrentSelection(selection);
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
  const eventType = EVENT_TYPES.find((type) => currentEvent[type] !== undefined);
  const isLastEvent =
    currentEventIndex === jsonData[currentPaperIndex].events.length - 1 &&
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
                  Last saved: {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(lastSaved)}
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
                className={`transition-all duration-300 ${isAbstractOpen ? 'max-h-96 overflow-y-auto' : 'max-h-0 overflow-hidden'}`}
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
                  annotations={currentEvent.annotations || []}
                  onAnnotationUpdate={handleAnnotationUpdate}
                  onSelectionUpdate={handleSelectionUpdate}
                  key={`${currentPaperIndex}-${currentEventIndex}`} // Ensure unique key
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
                  prepareDataForDownload={prepareDataForDownload} // Pass the function as a prop
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
                setCurrentEventIndex((prev) => prev - 1);
              } else if (currentPaperIndex > 0) {
                setCurrentPaperIndex((prev) => prev - 1);
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
              onClick={handleDownload} // This calls the same handleDownload function
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
                  setCurrentEventIndex((prev) => prev + 1);
                } else if (currentPaperIndex < jsonData.length - 1) {
                  setCurrentPaperIndex((prev) => prev + 1);
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
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors
                     ${isFileDropActive ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}`}
      >
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