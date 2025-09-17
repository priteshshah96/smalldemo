# SciEvent: Benchmarking Multi-domain Scientific Event Extraction

**Annotation Tool for EMNLP 2025**

This is the annotation tool developed for the paper "SciEvent: Benchmarking Multi-domain Scientific Event Extraction" submitted to EMNLP 2025.

## Authors

**Bofu Dong¹, Pritesh Shah¹, Sumedh Sonawane¹, Tiyasha Banerjee¹, Erin Brady¹, Xinya Du², Ming Jiang¹'³**

¹ Indiana University Indianapolis  
² University of Texas at Dallas  
³ University of Wisconsin-Madison

**Contact**: bofudong@iu.edu, ming.jiang@wisc.edu

---

## About

This web-based annotation tool enables researchers to annotate scientific text for event extraction tasks. The tool supports:

- **Multi-domain Scientific Event Annotation**: Annotate events across different scientific domains
- **Structured Annotation Schema**: Main Action, Agent, Primary/Secondary Objects, Context, Purpose, Method, Results, Analysis, Challenge, Ethical considerations, Implications, and Contradictions
- **Interactive Interface**: Real-time text highlighting and annotation with keyboard shortcuts
- **JSON Export**: Download annotated data for further analysis

## Quick Start

1. **Access the Tool**: Visit the deployed annotation interface
2. **Upload Data**: Upload your Event Extraction Raw JSON file
3. **Annotate**: Select text and assign annotation categories using the interface
4. **Export**: Download your completed annotations as JSON

## Installation (Development)

```bash
git clone https://github.com/priteshshah96/smalldemo.git
cd smalldemo
npm install
npm run dev
```

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Paper

This tool was developed to support the research presented in "SciEvent: Benchmarking Multi-domain Scientific Event Extraction" (EMNLP 2025).

---

**License**: MIT