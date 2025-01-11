import React, { useRef, useState, useEffect } from 'react';

// Enhanced highlight colors with better contrast
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

// Button configuration with matching colors
const ANNOTATION_BUTTONS = [
  { type: 'Main_Action', label: 'Main Action', baseColor: 'blue' },
  { type: 'Agent', label: 'Agent', baseColor: 'emerald' },
  { type: 'Object.Base_Object', label: 'Base Object', baseColor: 'violet' },
  { type: 'Object.Base_Modifier', label: 'Base Modifier', baseColor: 'violet' },
  { type: 'Object.Attached_Object', label: 'Attached Object', baseColor: 'violet' },
  { type: 'Object.Attached_Modifier', label: 'Attached Modifier', baseColor: 'violet' },
  { type: 'Context', label: 'Context', baseColor: 'amber' },
  { type: 'Purpose', label: 'Purpose', baseColor: 'fuchsia' },
  { type: 'Method', label: 'Method', baseColor: 'purple' },
  { type: 'Results', label: 'Results', baseColor: 'indigo' },
  { type: 'Analysis', label: 'Analysis', baseColor: 'sky' },
  { type: 'Challenge', label: 'Challenge', baseColor: 'teal' },
  { type: 'Ethical', label: 'Ethical', baseColor: 'yellow' },
  { type: 'Implications', label: 'Implications', baseColor: 'red' },
  { type: 'Contradictions', label: 'Contradictions', baseColor: 'rose' }
];

const TextAnnotationPanel = ({
  text,
  annotations,
  onTextSelect,
  onAnnotationSelect,
  selectedText
}) => {
  const textRef = useRef(null);
  const [hoveredAnnotation, setHoveredAnnotation] = useState(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedText) return;

      const numKey = parseInt(e.key);
      if (!isNaN(numKey) && numKey > 0 && numKey <= ANNOTATION_BUTTONS.length) {
        e.preventDefault();
        onAnnotationSelect(ANNOTATION_BUTTONS[numKey - 1].type);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedText, onAnnotationSelect]);

  const SelectedTextPrompt = () => (
    selectedText && (
      <div className="mb-4 p-3 bg-blue-100 rounded-lg" role="status">
        <span className="text-sm text-blue-800 font-medium">
          Current selected text: <strong>"{selectedText?.text}"</strong>
        </span>
      </div>
    )
  );

  const getAnnotationFragment = (fragment, annotationType, index) => (
    <mark
      key={`annotation-${index}`}
      className={`${HIGHLIGHT_COLORS[annotationType]} relative cursor-help transition-colors duration-150`}
      onMouseEnter={() => setHoveredAnnotation(index)}
      onMouseLeave={() => setHoveredAnnotation(null)}
      role="mark"
      aria-label={`${annotationType.replace('_', ' ')} annotation: ${fragment}`}
    >
      {fragment}
      {hoveredAnnotation === index && (
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 px-2 py-1 
                     bg-gray-800 text-white text-xs rounded z-10 whitespace-nowrap mb-1"
          role="tooltip"
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

    sortedAnnotations.forEach((annotation, index) => {
      if (annotation.start > lastIndex) {
        result.push(
          <span key={`text-${index}`}>
            {text.slice(lastIndex, annotation.start)}
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
      result.push(
        <span key="text-end">
          {text.slice(lastIndex)}
        </span>
      );
    }

    return result;
  };

  const handleMouseUp = (e) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText) {
      const range = selection.getRangeAt(0);
      const rangeRect = range.getBoundingClientRect();

      const textContent = textRef.current.textContent;
      const selectedStart = textContent.indexOf(selectedText);
      const selectedEnd = selectedStart + selectedText.length;

      // Only check for overlap with different argument types
      const isOverlapping = annotations.some(annotation => {
        // Check if the selected range overlaps with any existing annotation
        const hasOverlap = (
          (selectedStart >= annotation.start && selectedStart < annotation.end) ||
          (selectedEnd > annotation.start && selectedEnd <= annotation.end) ||
          (selectedStart <= annotation.start && selectedEnd >= annotation.end)
        );
        
        // Exclude cases where the selection is exactly adjacent
        const isAdjacent = (
          selectedStart === annotation.end ||
          selectedEnd === annotation.start
        );

        return hasOverlap && !isAdjacent;
      });

      if (isOverlapping) {
        alert('This text overlaps with an existing annotation. Please select a different text.');
        return;
      }

      onTextSelect({
        text: selectedText,
        position: {
          top: rangeRect.top + window.scrollY,
          left: rangeRect.left + window.scrollX,
          width: rangeRect.width
        },
        start: selectedStart,
        end: selectedEnd
      });
    }
  };

  const handleAnnotationClick = (annotationType) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText) {
      const range = selection.getRangeAt(0);
      const rangeRect = range.getBoundingClientRect();
      
      const textContent = textRef.current.textContent;
      const selectedStart = textContent.indexOf(selectedText);
      
      onTextSelect({
        text: selectedText,
        position: {
          top: rangeRect.top + window.scrollY,
          left: rangeRect.left + window.scrollX,
          width: rangeRect.width
        },
        start: selectedStart,
        end: selectedStart + selectedText.length,
        isMultiSpan: true  // Indicate this could be part of multiple spans
      });

      onAnnotationSelect(annotationType);
    }
  };

  return (
    <div>
      <SelectedTextPrompt />

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
          Select text and choose annotation type (or use number keys 1-{ANNOTATION_BUTTONS.length})
          <br />
          <span className="text-xs text-gray-500">Multiple text spans can be selected for the same argument type</span>
        </h3>
        <div 
          className="flex flex-wrap gap-2"
          role="group"
          aria-labelledby="annotation-buttons-label"
        >
          {ANNOTATION_BUTTONS.map((button, index) => (
            <button
              key={button.type}
              onClick={() => handleAnnotationClick(button.type)}
              className={`px-3 py-1.5 bg-${button.baseColor}-200 rounded-lg text-sm font-medium
                       hover:bg-${button.baseColor}-300 focus:ring-2 focus:ring-${button.baseColor}-500 
                       focus:ring-offset-2 transition-colors`}
              aria-label={`Annotate as ${button.label} (${index + 1})`}
              title={`Shortcut: Press ${index + 1}`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TextAnnotationPanel;