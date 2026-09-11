export interface StarterTemplate {
  id: string;
  name: string;
  category: 'web' | 'backend' | 'systems' | 'documents' | 'education';
  description: string;
  iconName: string;
  files: Array<{
    name: string;
    path: string;
    content: string;
    type: 'file' | 'folder';
  }>;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'template-react-ts',
    name: 'React 18 + TypeScript',
    category: 'web',
    description: 'Modern Vite + React 18 single page web application starter.',
    iconName: 'Code2',
    files: [
      { name: 'App.tsx', path: 'src/App.tsx', content: 'import React from "react";\n\nexport default function App() {\n  return <h1>Hello React!</h1>;\n}', type: 'file' },
      { name: 'main.tsx', path: 'src/main.tsx', content: 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\n\nReactDOM.createRoot(document.getElementById("root")!).render(<App />);', type: 'file' },
      { name: 'package.json', path: 'package.json', content: '{\n  "name": "react-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  }\n}', type: 'file' }
    ]
  },
  {
    id: 'template-nextjs',
    name: 'Next.js App Router',
    category: 'web',
    description: 'Full-stack Next.js web application template with React Server Components.',
    iconName: 'Layout',
    files: [
      { name: 'page.tsx', path: 'app/page.tsx', content: 'export default function Page() {\n  return <main><h1>Welcome to Next.js</h1></main>;\n}', type: 'file' },
      { name: 'layout.tsx', path: 'app/layout.tsx', content: 'export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html><body>{children}</body></html>;\n}', type: 'file' }
    ]
  },
  {
    id: 'template-vue',
    name: 'Vue 3 + Vite',
    category: 'web',
    description: 'Vue 3 composition API starter with reactive state.',
    iconName: 'Box',
    files: [
      { name: 'App.vue', path: 'src/App.vue', content: '<template>\n  <h1>{{ msg }}</h1>\n</template>\n<script setup>\nimport { ref } from "vue";\nconst msg = ref("Hello Vue 3!");\n</script>', type: 'file' }
    ]
  },
  {
    id: 'template-angular',
    name: 'Angular Standalone',
    category: 'web',
    description: 'Angular framework starter with component hierarchy.',
    iconName: 'Shield',
    files: [
      { name: 'app.component.ts', path: 'src/app/app.component.ts', content: 'import { Component } from "@angular/core";\n\n@Component({\n  selector: "app-root",\n  template: "<h1>Hello Angular!</h1>"\n})\nexport class AppComponent {}', type: 'file' }
    ]
  },
  {
    id: 'template-nodejs',
    name: 'Node.js Express Server',
    category: 'backend',
    description: 'RESTful API server starter with Express and middleware.',
    iconName: 'Server',
    files: [
      { name: 'server.js', path: 'server.js', content: 'const express = require("express");\nconst app = express();\napp.get("/", (req, res) => res.json({ status: "ok" }));\napp.listen(3000);', type: 'file' }
    ]
  },
  {
    id: 'template-python',
    name: 'Python FastAPI / Script',
    category: 'backend',
    description: 'Clean Python script & API framework structure.',
    iconName: 'Terminal',
    files: [
      { name: 'main.py', path: 'main.py', content: 'def main():\n    print("Hello from Python LivePad!")\n\nif __name__ == "__main__":\n    main()', type: 'file' }
    ]
  },
  {
    id: 'template-java',
    name: 'Java Console App',
    category: 'systems',
    description: 'Standard Java object-oriented application structure.',
    iconName: 'Cpu',
    files: [
      { name: 'Main.java', path: 'src/Main.java', content: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Java!");\n    }\n}', type: 'file' }
    ]
  },
  {
    id: 'template-cpp',
    name: 'C++ Native Runner',
    category: 'systems',
    description: 'Modern C++ application template.',
    iconName: 'Zap',
    files: [
      { name: 'main.cpp', path: 'main.cpp', content: '#include <iostream>\n\nint main() {\n    std::cout << "Hello C++!" << std::endl;\n    return 0;\n}', type: 'file' }
    ]
  },
  {
    id: 'template-markdown',
    name: 'Markdown Documentation Book',
    category: 'documents',
    description: 'Rich Markdown workspace with table of contents and documentation pages.',
    iconName: 'FileText',
    files: [
      { name: 'README.md', path: 'README.md', content: '# LivePad Documentation Book\n\nWelcome to your collaborative documentation project.', type: 'file' },
      { name: 'architecture.md', path: 'docs/architecture.md', content: '# System Architecture\n\nOverview of components and APIs.', type: 'file' }
    ]
  },
  {
    id: 'template-blank',
    name: 'Blank Project',
    category: 'documents',
    description: 'Clean, unopinionated empty workspace.',
    iconName: 'File',
    files: [
      { name: 'Note.txt', path: 'Note.txt', content: 'Start typing here...', type: 'file' }
    ]
  },
  {
    id: 'template-teaching',
    name: 'Teaching Workspace',
    category: 'education',
    description: 'Interactive classroom setup with instructions, exercise sheets, and code tests.',
    iconName: 'GraduationCap',
    files: [
      { name: 'INSTRUCTIONS.md', path: 'INSTRUCTIONS.md', content: '# Computer Science 101\n\n### Today\'s Goal:\nComplete the exercises in `exercise.js`.', type: 'file' },
      { name: 'exercise.js', path: 'exercise.js', content: '// TODO: Implement multiply function\nfunction multiply(a, b) {\n  return 0;\n}', type: 'file' }
    ]
  },
  {
    id: 'template-study-group',
    name: 'Study Group Collaborative Room',
    category: 'education',
    description: 'Shared notes workspace designed for real-time multiplayer peer review.',
    iconName: 'Users',
    files: [
      { name: 'MeetingNotes.md', path: 'MeetingNotes.md', content: '# Study Group Session\n\n**Participants:**\n- Alice\n- Bob\n\n## Discussion Topics:\n1. Problem set review\n2. System architecture', type: 'file' }
    ]
  }
];
