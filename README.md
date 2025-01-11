Here’s a **comprehensive README.md** for your project, complete with detailed explanations and sections for all aspects of your project:

---

### **README.md**

```markdown
# Annotation Tool

A React-based annotation tool that simplifies the process of annotating text documents. This tool allows users to upload JSON files, annotate text with predefined categories, navigate through events, and download annotated data in JSON format. Designed with a clean and interactive UI using **Vite** and **Tailwind CSS**, the tool is highly customizable and easy to use.

---

## **Table of Contents**
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Installation](#installation)
4. [Usage](#usage)
5. [File Structure](#file-structure)
6. [Annotation Workflow](#annotation-workflow)
7. [Development Scripts](#development-scripts)
8. [Future Enhancements](#future-enhancements)
9. [Contributing](#contributing)
10. [License](#license)
11. [Author](#author)

---

## **Features**
- **File Upload**:
  - Drag-and-drop JSON files or use the "Browse Files" button.
  - Supports input validation to ensure proper file structure.

- **Customizable Annotations**:
  - Annotate text with categories like:
    - **Main Action**
    - **Agent**
    - **Object** (Base Object, Modifier, Attached Object, etc.)
    - **Context, Purpose, Method, Results**, and more.
  - Multi-span support for assigning multiple text fragments to the same category.

- **Real-Time Feedback**:
  - Visual highlighting for annotated text with distinct colors for each category.
  - Tooltips for annotation details on hover.

- **Error Handling**:
  - Informative error messages for invalid JSON uploads or improper file structure.

- **Navigation**:
  - Easy navigation between multiple events and papers using "Next" and "Previous" buttons.

- **Download Functionality**:
  - Export annotated data as a JSON file.

---

## **Tech Stack**
- **Frontend**: React (with Vite for fast builds and development)
- **Styling**: Tailwind CSS for responsive and modular design
- **Icons**: Lucide React for lightweight and customizable icons
- **State Management**: React hooks (`useState`, `useEffect`) for managing UI states

---

## **Installation**

### **Prerequisites**
- Node.js (v16 or later)
- npm or yarn package manager

### **Steps**
1. Clone the repository:
   ```bash
   git clone https://github.com/priteshshah96/smalldemo.git
   cd smalldemo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173` to use the tool.

---

## **Usage**

### **1. Upload a JSON File**
- Drag and drop your JSON file or click the "Browse Files" button.
- Ensure the JSON file follows this structure:
  ```json
  [
    {
      "paper_code": "Paper1",
      "abstract": "Abstract text here.",
      "events": [
        {
          "Text": "Event text here",
          "Main Action": "Action description",
          "Arguments": {
            "Agent": "Agent description"
          }
        }
      ]
    }
  ]
  ```

### **2. Annotate Text**
- Select text in the document and assign a category from the toolbar.
- Multiple spans can be assigned to the same category (e.g., "Main Action").

### **3. Navigate Events**
- Use "Next" and "Previous" buttons to navigate through events and papers.

### **4. Download Annotated Data**
- Click the "Download JSON" button to export your annotations.

---

## **File Structure**

```plaintext
src/
├── App.jsx                  # Main application logic
├── index.js                 # React entry point
├── components/              # All reusable components
│   ├── JsonViewer.jsx       # Displays JSON annotations
│   ├── SelectionToolbar.jsx # Toolbar for selecting annotation types
│   ├── TextAnnotationPanel.jsx # Handles text highlighting and annotation
├── styles/                  # Tailwind CSS configuration
├── assets/                  # Static assets (if any)
```

---

## **Annotation Workflow**

1. **Upload JSON**: Upload a JSON file containing text to annotate.
2. **Text Selection**:
   - Highlight text to select it.
   - Choose a category from the toolbar.
3. **Highlight Annotations**:
   - View highlighted text annotations in real-time.
4. **JSON Viewer**:
   - Inspect and edit JSON annotations.
   - Delete specific annotations if needed.
5. **Download**:
   - Export the annotated JSON file for further use.

---

## **Development Scripts**

- `npm run dev`: Start the development server.
- `npm run build`: Build the project for production.
- `npm run preview`: Preview the production build.
- `npm run lint`: Run the linter to check for code quality issues.

---

## **Future Enhancements**
- Support for additional annotation types and sub-categories.
- Enhanced validation for uploaded JSON files.
- Undo/Redo functionality for annotations.
- Keyboard shortcuts for faster annotation.
- Multi-language support for annotations.
- Collaboration features for team-based annotation.

---

## **Contributing**
Contributions are welcome! Please follow these steps to contribute:
1. Fork this repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your feature description"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request.

---

## **License**
This project is licensed under the [MIT License](LICENSE).

---

## **Author**
**Pritesh Shah**  
[GitHub Profile](https://github.com/priteshshah96)  

Feel free to reach out with questions or suggestions!
```

