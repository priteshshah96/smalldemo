import React, { useRef, useState, useEffect } from 'react';
import { cleanSelectedText, annotationStore } from './TextAnnotationUtils';
import Toast from './Toast';


const PERSISTENT_SELECTION_STYLE = 'bg-blue-100 border-2 border-blue-300 rounded';

const HIGHLIGHT_COLORS = {
  'Main_Action': 'bg-blue-200 hover:bg-blue-300',
  'Agent': 'bg-green-200 hover:bg-green-300',
  'Primary_Object': 'bg-violet-200 hover:bg-violet-300',
  'Secondary_Object': 'bg-indigo-200 hover:bg-indigo-300',
  'Context': 'bg-orange-200 hover:bg-orange-300',
  'Purpose': 'bg-pink-200 hover:bg-pink-300', 
  'Method': 'bg-red-200 hover:bg-red-300',
  'Results': 'bg-amber-200 hover:bg-amber-300',
  'Analysis': 'bg-lime-200 hover:bg-lime-300',
  'Challenge': 'bg-cyan-200 hover:bg-cyan-300',
  'Ethical': 'bg-emerald-400 hover:bg-emerald-700',
  'Implications': 'bg-red-400 hover:bg-red-700',
  'Contradictions': 'bg-fuchsia-200 hover:bg-fuchsia-300'
};

const KEYBOARD_SHORTCUTS = {
  'Main_Action': '1',
  'Agent': '2',
  'Primary_Object': '3',
  'Secondary_Object': '4',
  'Context': '5',
  'Purpose': '6',
  'Method': '7',
  'Results': '8',
  'Analysis': '9',
  'Challenge': '0',
  'Ethical': 'e',
  'Implications': 'i',
  'Contradictions': 'd'
};

const ANNOTATION_BUTTONS = [
  { type: 'Main_Action', label: 'Main Action', baseColor: 'blue', description: 'The most representative verb/verb phrase of the paragraph' },
  { type: 'Agent', label: 'Agent', baseColor: 'green', description: 'Person or Thing that does the Main Action' },
  { type: 'Primary_Object', label: 'Primary Object', baseColor: 'violet', description: 'Primary receiver/target of the Main Action' },
  { type: 'Secondary_Object', label: 'Secondary Object', baseColor: 'indigo', description: 'Secondary receiver/target of the Main Action' },
  { type: 'Context', label: 'Context', baseColor: 'orange', description: 'Foundational or situational information of the paragraph' },
  { type: 'Purpose', label: 'Purpose', baseColor: 'pink', description: 'Purpose or aim of the paragraph' },
  { type: 'Method', label: 'Method', baseColor: 'red', description: 'Techniques, tools, methodology or frameworks used in the paragraph' },
  { type: 'Results', label: 'Results', baseColor: 'amber', description: 'Observations or outputs of the paragraph' },
  { type: 'Analysis', label: 'Analysis', baseColor: 'lime', description: 'Interpretation or explanation of other Arguments' },
  { type: 'Challenge', label: 'Challenge', baseColor: 'cyan', description: 'Constraints or weaknesses of the Context, Method or Results' },
  { type: 'Ethical', label: 'Ethical', baseColor: 'emerald-400 text-white', description: 'Ethical concerns, implications, and justifications of the paragraph' },
  { type: 'Implications', label: 'Implications', baseColor: 'red-400 text-white', description: 'Broader applicability or significance and future research' },
  { type: 'Contradictions', label: 'Contradictions', baseColor: 'fuchsia', description: 'Disagreements to existing knowledge' }
];

const TextAnnotationPanel = ({
  text,
  annotations = [],
  onAnnotationUpdate,
  onSelectionUpdate, // New prop to notify parent about selection
  eventType
}) => {
  const textRef = useRef(null);
  const panelRef = useRef(null);
  const buttonsRef = useRef([]);
  
  // State
  const [hoveredAnnotation, setHoveredAnnotation] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [currentSelection, setCurrentSelection] = useState(null);
  const [selectionActive, setSelectionActive] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  // Check if Main Action exists
  const hasMainAction = annotations.some(ann => ann.type === 'Main_Action');

  // Clear current selection
  const clearSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      try {
        selection.removeAllRanges();
      } catch (e) {
        selection.empty();
      }
    }
    setSelectionActive(false);
    setCurrentSelection(null);
    setIsSelecting(false);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle copy command (Ctrl+C or Cmd+C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        // Let default copy behavior work
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (currentSelection || window.getSelection()?.toString().trim()) {
          clearSelection();
        }
        return;
      }

      if (!currentSelection) return;

      const key = e.key.toLowerCase();
      const annotationType = Object.entries(KEYBOARD_SHORTCUTS).find(([_, shortcut]) => 
        shortcut.toLowerCase() === key
      )?.[0];

      if (annotationType) {
        e.preventDefault();
        if (annotationType !== 'Main_Action' && !hasMainAction) {
          setShowToast(true);
          setStatusMessage('Please annotate Main Action first');
          return;
        }
        handleAnnotationClick(annotationType);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [currentSelection, hasMainAction]);

  // Clear selection on event type change
  useEffect(() => {
    clearSelection();
  }, [eventType]);

  useEffect(() => {
    const handleDocumentClick = (e) => {
      // Skip if no selection
      if (!currentSelection && !window.getSelection()?.toString().trim()) {
        return;
      }

      // Skip if clicking inside the text panel
      if (textRef.current?.contains(e.target)) {
        return;
      }

      // Skip if clicking on annotation buttons
      if (buttonsRef.current.some(button => button?.contains(e.target))) {
        return;
      }

      // Clear selection for clicks outside panel
      clearSelection();
      // Notify parent component
      onSelectionUpdate(null);
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [currentSelection, onSelectionUpdate]);

  const handleMouseDown = (e) => {
    if (!textRef.current?.contains(e.target)) {
      e.preventDefault();
      return;
    }
    setIsSelecting(true);
  };

  const handleMouseMove = (e) => {
    if (!isSelecting) return;
    
    if (!textRef.current?.contains(e.target)) {
      clearSelection();
      setShowToast(true);
      setStatusMessage('Please keep your selection inside the text box.');
    }
  };

  // Get text content up to a node
  const getTextUpToNode = (node) => {
    const textNodes = [];
    const walk = document.createTreeWalker(
      textRef.current,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let currentNode;
    while ((currentNode = walk.nextNode())) {
      if (currentNode === node) {
        break;
      }
      textNodes.push(currentNode.textContent);
    }

    return textNodes.join('');
  };

  const calculateExactOffsets = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
  
    const range = selection.getRangeAt(0);
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
  
    // Get text content before the selection starts
    const textBeforeStart = getTextUpToNode(startContainer);
    const textBeforeEnd = getTextUpToNode(endContainer);
  
    // Calculate exact positions
    let startPos = textBeforeStart.length + range.startOffset;
    let endPos = textBeforeEnd.length + range.endOffset;
  
    // Adjust for leading/trailing whitespace
    const selectedText = text.substring(startPos, endPos);
    const trimmedText = selectedText.trim();
    const leadingWhitespace = selectedText.length - selectedText.trimStart().length;
    const trailingWhitespace = selectedText.length - selectedText.trimEnd().length;
  
    startPos += leadingWhitespace;
    endPos -= trailingWhitespace;
  
    return { startPos, endPos };
  };

  const handleMouseUp = (e) => {
    setIsSelecting(false);
  
    const selection = window.getSelection();
    let selectedText = selection.toString().trim();
    if (!selectedText) {
      clearSelection();
      return;
    }
  
    const isStartInPanel = textRef.current?.contains(selection.anchorNode);
    const isEndInPanel = textRef.current?.contains(selection.focusNode);
  
    if (!isStartInPanel || !isEndInPanel) {
      clearSelection();
      setShowToast({ message: 'Please keep your selection inside the text box.', type: 'error' }); // Set toast message
      return;
    }
  
    const positions = calculateExactOffsets();
    if (!positions || positions.startPos === null || positions.endPos === null) {
      clearSelection();
      return;
    }
  
    // Clean and prepare the selection
    const rawSelectedText = text.substring(positions.startPos, positions.endPos);
    const cleanedText = cleanSelectedText(rawSelectedText);
  
    // Check for overlapping annotations
    const isOverlapping = annotations.some(annotation => (
      (positions.startPos >= annotation.start && positions.startPos < annotation.end) ||
      (positions.endPos > annotation.start && positions.endPos <= annotation.end) ||
      (positions.startPos <= annotation.start && positions.endPos >= annotation.end)
    ));
  
    if (isOverlapping) {
      clearSelection();
      setShowToast({ message: 'Selection overlaps with existing annotation.', type: 'error' }); // Set toast message
      return;
    }
  
    // Set the current selection
    const selectionData = {
      text: cleanedText,
      start: positions.startPos,
      end: positions.endPos
    };
    setCurrentSelection(selectionData);
    onSelectionUpdate(selectionData); // Notify parent component
    setSelectionActive(true);
  };

  const handleMouseLeave = (e) => {
    if (isSelecting) {
      clearSelection();
      setShowToast({ message: 'Please keep your selection inside the text box.', type: 'error' }); // Set toast message
    }
  };

  const handleAnnotationClick = (annotationType) => {
    if (!currentSelection) {
      setShowToast({ message: 'Please select text before adding an annotation.', type: 'error' });
      return;
    }
  
    // Prevent multiple Main Action annotations
    if (annotationType === 'Main_Action' && hasMainAction) {
      setShowToast({ message: 'Main Action already annotated. Please remove the existing one first.', type: 'error' });
      return;
    }
  
    if (annotationType !== 'Main_Action' && !hasMainAction) {
      setShowToast({ message: 'Please annotate Main Action first', type: 'error' });
      return;
    }
  
    if (currentSelection) {
      // Add to annotation store and get ID
      const annotationId = annotationStore.addAnnotation(
        currentSelection.text,
        currentSelection.start,
        currentSelection.end
      );
  
      // Notify parent component
      onAnnotationUpdate(annotationType, annotationId);
      
      // Clear selection and show feedback
      clearSelection();
      setShowToast({ message: `Applied ${annotationType.replace('_', ' ')} annotation`, type: 'success' });
    }
  };

  const renderHighlightedText = () => {
    if (!text) return null;
  
    let lastIndex = 0;
    const sortedAnnotations = [...annotations].sort((a, b) => a.start - b.start);
    const result = [];
  
    sortedAnnotations.forEach((annotation, index) => {
      if (annotation.start > lastIndex) {
        const segment = text.slice(lastIndex, annotation.start);
        const isSelected = currentSelection && selectionActive &&
                         currentSelection.start <= lastIndex &&
                         currentSelection.end >= annotation.start;
  
        result.push(
          <span 
            key={`text-${index}`}
            className={isSelected ? PERSISTENT_SELECTION_STYLE : ''}
          >
            {segment}
          </span>
        );
      }
  
      const annotationData = annotationStore.getAnnotation(annotation.id);
      const annotationText = annotationData ? annotationData.text : text.slice(annotation.start, annotation.end);
  
      result.push(
        <mark
          key={`annotation-${index}`}
          className={`${HIGHLIGHT_COLORS[annotation.type]} relative cursor-help transition-all duration-1`}
          onMouseEnter={() => setHoveredAnnotation(index)}
          onMouseLeave={() => setHoveredAnnotation(null)}
          role="mark"
          aria-label={`${annotation.type.replace('_', ' ')} annotation: ${annotationText}`}
          tabIndex="0"
        >
          {annotationText}
          {hoveredAnnotation === index && (
            <div 
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 px-2 py-1 
                      bg-gray-800 text-white text-xs rounded z-10 whitespace-nowrap mb-1
                      transition-opacity duration-75"
              role="tooltip"
              id={`tooltip-${index}`}
              aria-hidden="true"
            >
              {annotation.type.replace('_', ' ')}
            </div>
          )}
        </mark>
      );
  
      lastIndex = annotation.end;
    });
  
    if (lastIndex < text.length) {
      const segment = text.slice(lastIndex);
      const isSelected = currentSelection && selectionActive &&
                       currentSelection.start <= lastIndex &&
                       currentSelection.end >= text.length;
  
      result.push(
        <span 
          key="text-end"
          className={isSelected ? PERSISTENT_SELECTION_STYLE : ''}
        >
          {segment}
        </span>
      );
    }
  
    return result;
  };

  return (
    <div ref={panelRef} role="application" aria-label="Text Annotation Panel">
      {showToast && (
        <Toast 
          message={showToast.message} 
          type={showToast.type}
          onClose={() => setShowToast(false)} 
        />
      )}

      <div aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      {!hasMainAction && (
        <div className="mb-4 p-3 bg-yellow-100 rounded-lg border border-yellow-200" role="alert">
          <span className="text-sm text-yellow-800 font-medium">
            ⚠️ Please annotate the Main Action first before adding other annotations
          </span>
        </div>
      )}

      {currentSelection && (
        <div className="mb-4 p-3 bg-blue-100 rounded-lg" role="status" aria-live="polite">
          <span className="text-sm text-blue-800 font-medium">
            Current selected text: <strong>"{currentSelection.text}"</strong>
            <br />
            <span className="text-xs text-blue-600">Press ESC to clear selection</span>
          </span>
        </div>
      )}

      <div 
        ref={textRef}
        className="prose max-w-none text-gray-800 leading-relaxed mb-6 border-2 border-gray-300 rounded-lg p-4 selectable-text"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ fontSize: '1.125rem', lineHeight: '1.8' }}
        role="textbox"
        aria-label="Annotatable text content"
        tabIndex="0"
      >
        {renderHighlightedText()}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3" id="annotation-buttons-label">
          Select text and choose annotation type
          <br />
          <span className="text-xs text-gray-500">
            Use keyboard shortcuts shown on buttons or select with mouse/keyboard
          </span>
        </h3>

        <div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
          role="group"
          aria-labelledby="annotation-buttons-label"
        >
          {ANNOTATION_BUTTONS.map((button, index) => {
            const isDisabled = button.type !== 'Main_Action' && !hasMainAction;
            const shortcut = KEYBOARD_SHORTCUTS[button.type];
            const buttonColor = button.type === 'Implications' 
              ? `bg-red-400 hover:bg-red-500`
              : `bg-${button.baseColor}-200 hover:bg-${button.baseColor}-300`;

              return (
                <button
                  key={button.type}
                  ref={el => buttonsRef.current[index] = el}
                  onClick={() => handleAnnotationClick(button.type)}
                  disabled={isDisabled}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                    focus:outline-none focus:ring-2 
                    ${isDisabled 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : buttonColor}`}
                  aria-label={`${button.label} (Press ${shortcut})`}
                  aria-disabled={isDisabled}
                  title={isDisabled
                    ? 'Please annotate Main Action first'
                    : `${button.description} (Shortcut: ${shortcut})`}
                >
                  <span>{button.label}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {shortcut}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Keyboard Instructions */}
      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Keyboard navigation:</strong>
          <br />
          • Use Tab to move between buttons
          <br />
          • Press Enter to activate buttons
          <br />
          • Use number keys 1-9, 0 and letters (e,i,d) for quick annotation
          <br />
          • Press ESC to clear text selection
          <br />
          • Use Ctrl+C/Cmd+C to copy selected text
        </p>
      </div>
    </div>
  );
};

export default TextAnnotationPanel;
