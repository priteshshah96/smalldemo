import React, { useRef, useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import Toast from './Toast';

// Enhanced highlight colors with better contrast for accessibility
const HIGHLIGHT_COLORS = {
  'Main_Action': 'bg-blue-200 hover:bg-blue-300',
  'Agent': 'bg-emerald-200 hover:bg-emerald-300',
  'Object.Base_Object': 'bg-violet-200 hover:bg-violet-300',
  'Object.Base_Modifier': 'bg-violet-200 hover:bg-violet-300',
  'Object.Attached_Object': 'bg-violet-200 hover:bg-violet-300',
  'Object.Attached_Modifier': 'bg-violet-200 hover:bg-violet-300',
  'Context': 'bg-amber-200 hover:bg-amber-300',
  'Purpose': 'bg-fuchsia-200 hover:bg-fuchsia-300',
  'Method': 'bg-purple-200 hover:bg-purple-300',
  'Results': 'bg-indigo-200 hover:bg-indigo-300',
  'Analysis': 'bg-sky-200 hover:bg-sky-300',
  'Challenge': 'bg-teal-200 hover:bg-teal-300',
  'Ethical': 'bg-yellow-200 hover:bg-yellow-300',
  'Implications': 'bg-red-200 hover:bg-red-300',
  'Contradictions': 'bg-rose-200 hover:bg-rose-300'
};

// Style for persistent text selection
const PERSISTENT_SELECTION_STYLE = 'bg-blue-100 border-blue-200 border rounded';

// Keyboard shortcuts mapping
const KEYBOARD_SHORTCUTS = {
  'Main_Action': '1',
  'Agent': '2',
  'Object.Base_Object': '3',
  'Object.Base_Modifier': '4',
  'Object.Attached_Object': '5',
  'Object.Attached_Modifier': '6',
  'Context': '7',
  'Purpose': '8',
  'Method': '9',
  'Results': 'r',
  'Analysis': 'a',
  'Challenge': 'c',
  'Ethical': 'e',
  'Implications': 'i',
  'Contradictions': 'd'
};

// Button configuration with matching colors and descriptions
const ANNOTATION_BUTTONS = [
  { type: 'Main_Action', label: 'Main Action', baseColor: 'blue', description: 'Primary action or event being described' },
  { type: 'Agent', label: 'Agent', baseColor: 'emerald', description: 'Entity performing the action' },
  { type: 'Object.Base_Object', label: 'Base Object', baseColor: 'violet', description: 'Primary object involved in the action' },
  { type: 'Object.Base_Modifier', label: 'Base Modifier', baseColor: 'violet', description: 'Description or qualifier of base object' },
  { type: 'Object.Attached_Object', label: 'Attached Object', baseColor: 'violet', description: 'Secondary object connected to base object' },
  { type: 'Object.Attached_Modifier', label: 'Attached Modifier', baseColor: 'violet', description: 'Description of attached object' },
  { type: 'Context', label: 'Context', baseColor: 'amber', description: 'Surrounding circumstances or conditions' },
  { type: 'Purpose', label: 'Purpose', baseColor: 'fuchsia', description: 'Goal or intended outcome' },
  { type: 'Method', label: 'Method', baseColor: 'purple', description: 'How the action is performed' },
  { type: 'Results', label: 'Results', baseColor: 'indigo', description: 'Outcome or consequences' },
  { type: 'Analysis', label: 'Analysis', baseColor: 'sky', description: 'Interpretation or evaluation' },
  { type: 'Challenge', label: 'Challenge', baseColor: 'teal', description: 'Difficulties or obstacles' },
  { type: 'Ethical', label: 'Ethical', baseColor: 'yellow', description: 'Moral or ethical considerations' },
  { type: 'Implications', label: 'Implications', baseColor: 'red', description: 'Future impact or significance' },
  { type: 'Contradictions', label: 'Contradictions', baseColor: 'rose', description: 'Inconsistencies or conflicts' }
];

const TextAnnotationPanel = ({
  text,
  annotations,
  onTextSelect,
  onAnnotationSelect,
  selectedText,
  eventType
}) => {
  const textRef = useRef(null);
  const buttonsRef = useRef([]);
  const [hoveredAnnotation, setHoveredAnnotation] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [lastSelection, setLastSelection] = useState(null);
  const [selectionActive, setSelectionActive] = useState(false);

  // Check if Main Action exists
  const hasMainAction = annotations.some(annotation => annotation.type === 'Main_Action');

  // Clear selection when event type changes
  useEffect(() => {
    if (selectedText || lastSelection) {
      onTextSelect(null);
      window.getSelection()?.removeAllRanges();
      setLastSelection(null);
      setSelectionActive(false);
    }
  }, [eventType]);

  // Handle keyboard shortcuts and navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();

      if (e.key === 'Escape') {
        e.preventDefault();
        onTextSelect(null);
        window.getSelection()?.removeAllRanges();
        setLastSelection(null);
        setSelectionActive(false);
        setStatusMessage('Selection cleared');
        return;
      }

      const button = ANNOTATION_BUTTONS.find(btn => KEYBOARD_SHORTCUTS[btn.type] === key);
      if (button && (lastSelection || selectedText)) {
        e.preventDefault();
        if (button.type === 'Main_Action' || hasMainAction) {
          handleAnnotationClick(button.type);
        } else {
          setShowToast(true);
          setStatusMessage('Please annotate Main Action first');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedText, lastSelection, onAnnotationSelect, hasMainAction]);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleMouseUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && textRef.current) {
      const range = selection.getRangeAt(0);
      
      // Get the text content up to the selection start
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(textRef.current);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const start = preSelectionRange.toString().length;
      
      const selectionInfo = {
        text: selectedText,
        position: range.getBoundingClientRect(),
        start: start,
        end: start + selectedText.length
      };

      // Check for overlapping with existing annotations
      const isOverlapping = annotations.some(annotation => {
        const hasOverlap = (
          (start >= annotation.start && start < annotation.end) ||
          (start + selectedText.length > annotation.start && start + selectedText.length <= annotation.end) ||
          (start <= annotation.start && start + selectedText.length >= annotation.end)
        );
        
        return hasOverlap;
      });

      if (isOverlapping) {
        setShowToast(true);
        setStatusMessage('Selection overlaps with existing annotation. Please select different text.');
        selection.removeAllRanges();
        setSelectionActive(false);
        return;
      }

      setLastSelection(selectionInfo);
      onTextSelect(selectionInfo);
      setSelectionActive(true);
      setStatusMessage('Text selected. Choose an annotation type.');
      
      // Prevent selection from being cleared
      e.preventDefault();
    }
  };

  const handleAnnotationClick = (annotationType) => {
    if (annotationType !== 'Main_Action' && !hasMainAction) {
      setShowToast(true);
      setStatusMessage('Please annotate Main Action first');
      return;
    }

    const currentSelection = lastSelection || selectedText;
    if (currentSelection) {
      onAnnotationSelect(annotationType);
      setStatusMessage(`Applied ${annotationType.replace('_', ' ')} annotation`);
      window.getSelection()?.removeAllRanges();
      setLastSelection(null);
      setSelectionActive(false);
      onTextSelect(null);
    }
  };

  const getAnnotationFragment = (fragment, annotationType, index) => (
    <mark
      key={`annotation-${index}`}
      className={`${HIGHLIGHT_COLORS[annotationType]} relative cursor-help transition-colors duration-150`}
      onMouseEnter={() => setHoveredAnnotation(index)}
      onMouseLeave={() => setHoveredAnnotation(null)}
      role="mark"
      aria-label={`${annotationType.replace('_', ' ')} annotation: ${fragment}`}
      tabIndex="0"
    >
      {fragment}
      {hoveredAnnotation === index && (
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 px-2 py-1 
                     bg-gray-800 text-white text-xs rounded z-10 whitespace-nowrap mb-1"
          role="tooltip"
          id={`tooltip-${index}`}
          aria-hidden="true"
        >
          {annotationType.replace('_', ' ')}
        </div>
      )}
    </mark>
  );

  const renderHighlightedText = () => {
    if (!text) return null;

    let lastIndex = 0;
    const sortedAnnotations = [...annotations].sort((a, b) => a.start - b.start);
    const result = [];
    const currentSelection = lastSelection || selectedText;

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

      result.push(
        getAnnotationFragment(
          text.slice(annotation.start, annotation.end),
          annotation.type,
          index
        )
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
    <div role="application" aria-label="Text Annotation Panel">
      {showToast && (
        <Toast 
          message={statusMessage} 
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
      
      {(selectedText || lastSelection) && (
        <div className="mb-4 p-3 bg-blue-100 rounded-lg" role="status" aria-live="polite">
          <span className="text-sm text-blue-800 font-medium">
            Current selected text: <strong>"{(selectedText || lastSelection)?.text}"</strong>
            <br />
            <span className="text-xs text-blue-600">Press ESC to clear selection</span>
          </span>
        </div>
      )}

      <div 
        ref={textRef}
        className="prose max-w-none text-gray-800 leading-relaxed select-text mb-6"
        onMouseUp={handleMouseUp}
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
            
            return (
              <button
                key={button.type}
                ref={el => buttonsRef.current[index] = el}
                onClick={() => handleAnnotationClick(button.type)}
                disabled={isDisabled}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  focus:outline-none focus:ring-2 
                  ${isDisabled 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : `bg-${button.baseColor}-200 hover:bg-${button.baseColor}-300 
                       focus:ring-${button.baseColor}-500 focus:ring-offset-2`
                  }
                `}
                aria-label={`${button.label} (Press ${shortcut})`}
                aria-disabled={isDisabled}
                aria-description={button.description}
                title={isDisabled
                  ? 'Please annotate Main Action first'
                  : `${button.description} (Shortcut: ${shortcut})`
                }
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
      <div 
        className="mt-4 text-sm text-gray-600"
        role="complementary"
        aria-label="Keyboard navigation instructions"
      >
        <p>
          <strong>Keyboard navigation:</strong>
          <br />
          • Use Tab to move between buttons
          <br />
          • Press Enter to activate buttons
          <br />
          • Use number keys 1-9 and letters (r,a,c,e,i,d) for quick annotation
          <br />
          • Press ESC to clear text selection
        </p>
      </div>
    </div>
  );
};

export default TextAnnotationPanel;