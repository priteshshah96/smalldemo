// TextAnnotationUtils.jsx

// Helper function to clean text selection
export const cleanSelectedText = (text) => {
    // Use trim() to remove ONLY leading and trailing whitespace
    return text.trim();
  };
  
  // Helper function to generate unique IDs for annotations
  export const generateAnnotationId = () => {
    return `ann_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  };
  
  // Helper function to prepare data for download
  export const prepareDataForDownload = (obj) => {
    if (!obj) return obj;
  
    // Handle strings (resolve annotation IDs to text)
    if (typeof obj === 'string') {
      const annotation = annotationStore.getAnnotation(obj);
      return annotation ? annotation.text : obj;
    }
  
    // Handle arrays (resolve annotation IDs but keep empty values)
    if (Array.isArray(obj)) {
      return obj.map((item) => {
        const annotation = annotationStore.getAnnotation(item);
        return annotation ? annotation.text : item;
      });
    }
  
    // Handle objects (recursively process and maintain field order)
    if (typeof obj === 'object' && obj !== null) {
      const result = {};
  
      // Define the desired field order
      const fieldOrder = [
        'Background',
        'Method',
        'Result',
        'Conclusion',
        'Text',
        'Action', // Ensure Action appears before Arguments
        'Arguments',
      ];

      // Define the Arguments field order
      const argumentsOrder = [
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
        'Contradictions',
      ];

      // Define the Object field order
      const objectOrder = [
        'Primary Object',
        'Secondary Object',
      ];
  
      // Iterate over the desired field order and include only existing fields
      fieldOrder.forEach((key) => {
        if (obj.hasOwnProperty(key)) {
          if (key === 'Arguments' && typeof obj[key] === 'object' && obj[key] !== null) {
            // Handle Arguments field with custom ordering
            const orderedArguments = {};
            argumentsOrder.forEach((argKey) => {
              if (obj[key].hasOwnProperty(argKey)) {
                if (argKey === 'Object' && typeof obj[key][argKey] === 'object' && obj[key][argKey] !== null) {
                  // Handle nested Object field with custom ordering
                  const orderedObject = {};
                  objectOrder.forEach((objKey) => {
                    if (obj[key][argKey].hasOwnProperty(objKey)) {
                      orderedObject[objKey] = prepareDataForDownload(obj[key][argKey][objKey]);
                    }
                  });
                  // Include any additional fields not in the predefined order
                  Object.keys(obj[key][argKey]).forEach((objKey) => {
                    if (!objectOrder.includes(objKey)) {
                      orderedObject[objKey] = prepareDataForDownload(obj[key][argKey][objKey]);
                    }
                  });
                  orderedArguments[argKey] = orderedObject;
                } else {
                  orderedArguments[argKey] = prepareDataForDownload(obj[key][argKey]);
                }
              }
            });
            // Include any additional fields not in the predefined order
            Object.keys(obj[key]).forEach((argKey) => {
              if (!argumentsOrder.includes(argKey)) {
                orderedArguments[argKey] = prepareDataForDownload(obj[key][argKey]);
              }
            });
            result[key] = orderedArguments;
          } else {
            result[key] = prepareDataForDownload(obj[key]);
          }
        }
      });
  
      // Include any additional fields not in the predefined order
      Object.keys(obj).forEach((key) => {
        if (!fieldOrder.includes(key) && key !== 'annotations') {
          result[key] = prepareDataForDownload(obj[key]);
        }
      });
  
      return result;
    }
  
    // Return the value as-is for other types (numbers, booleans, etc.)
    return obj;
  };
  
  // AnnotationStore class to manage annotations
  class AnnotationStore {
    constructor() {
      this.annotations = new Map();
    }
  
    // Add a new annotation
    addAnnotation(text, start, end) {
      const id = generateAnnotationId();
      const cleanedText = cleanSelectedText(text);
      this.annotations.set(id, {
        text: cleanedText,
        start,
        end,
      });
      return id;
    }
  
    // Get an annotation by ID
    getAnnotation(id) {
      return this.annotations.get(id);
    }
  
    // Remove an annotation by ID
    removeAnnotation(id) {
      this.annotations.delete(id);
    }
  
    // Get all annotations
    getAllAnnotations() {
      return Array.from(this.annotations.entries()).map(([id, data]) => ({
        id,
        ...data,
      }));
    }
  
    // Clear all annotations
    clear() {
      this.annotations.clear();
    }
  
    // Check if an ID exists
    hasAnnotation(id) {
      return this.annotations.has(id);
    }
  
    // Update an existing annotation
    updateAnnotation(id, text, start, end) {
      if (this.annotations.has(id)) {
        this.annotations.set(id, {
          text: cleanSelectedText(text),
          start,
          end,
        });
        return true;
      }
      return false;
    }
  }
  
  // Create and export a singleton instance
  const annotationStore = new AnnotationStore();
  
  // Export everything
  export { annotationStore };
  
  // Export the class for testing or if multiple instances are needed
  export default AnnotationStore;