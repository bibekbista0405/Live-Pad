export interface LanguageDef {
  id: string;
  name: string;
  extensions: string[];
  monacoLang: string;
  color: string;
}

export const SUPPORTED_LANGUAGES: LanguageDef[] = [
  { id: 'html', name: 'HTML', extensions: ['html', 'htm'], monacoLang: 'html', color: 'text-orange-500' },
  { id: 'css', name: 'CSS', extensions: ['css', 'scss', 'less'], monacoLang: 'css', color: 'text-cyan-400' },
  { id: 'javascript', name: 'JavaScript', extensions: ['js', 'mjs', 'cjs'], monacoLang: 'javascript', color: 'text-yellow-400' },
  { id: 'typescript', name: 'TypeScript', extensions: ['ts'], monacoLang: 'typescript', color: 'text-blue-400' },
  { id: 'react', name: 'React (JSX/TSX)', extensions: ['jsx', 'tsx'], monacoLang: 'typescript', color: 'text-sky-400' },
  { id: 'vue', name: 'Vue', extensions: ['vue'], monacoLang: 'html', color: 'text-emerald-400' },
  { id: 'python', name: 'Python', extensions: ['py', 'pyw'], monacoLang: 'python', color: 'text-emerald-500' },
  { id: 'java', name: 'Java', extensions: ['java'], monacoLang: 'java', color: 'text-rose-500' },
  { id: 'c', name: 'C', extensions: ['c', 'h'], monacoLang: 'c', color: 'text-blue-500' },
  { id: 'cpp', name: 'C++', extensions: ['cpp', 'hpp', 'cc', 'cxx'], monacoLang: 'cpp', color: 'text-indigo-400' },
  { id: 'csharp', name: 'C#', extensions: ['cs'], monacoLang: 'csharp', color: 'text-purple-400' },
  { id: 'go', name: 'Go', extensions: ['go'], monacoLang: 'go', color: 'text-cyan-300' },
  { id: 'rust', name: 'Rust', extensions: ['rs'], monacoLang: 'rust', color: 'text-amber-500' },
  { id: 'php', name: 'PHP', extensions: ['php'], monacoLang: 'php', color: 'text-violet-400' },
  { id: 'ruby', name: 'Ruby', extensions: ['rb'], monacoLang: 'ruby', color: 'text-red-400' },
  { id: 'swift', name: 'Swift', extensions: ['swift'], monacoLang: 'swift', color: 'text-orange-400' },
  { id: 'kotlin', name: 'Kotlin', extensions: ['kt', 'kts'], monacoLang: 'kotlin', color: 'text-purple-500' },
  { id: 'dart', name: 'Dart', extensions: ['dart'], monacoLang: 'dart', color: 'text-sky-500' },
  { id: 'sql', name: 'SQL', extensions: ['sql'], monacoLang: 'sql', color: 'text-amber-300' },
  { id: 'json', name: 'JSON', extensions: ['json', 'json5'], monacoLang: 'json', color: 'text-amber-400' },
  { id: 'yaml', name: 'YAML', extensions: ['yaml', 'yml'], monacoLang: 'yaml', color: 'text-red-400' },
  { id: 'markdown', name: 'Markdown', extensions: ['md', 'markdown'], monacoLang: 'markdown', color: 'text-indigo-300' },
  { id: 'xml', name: 'XML', extensions: ['xml', 'svg'], monacoLang: 'xml', color: 'text-emerald-300' },
];

export function getLanguageFromExtension(fileNameOrExt: string): string {
  if (!fileNameOrExt) return 'javascript';
  const cleanExt = fileNameOrExt.includes('.')
    ? fileNameOrExt.split('.').pop()?.toLowerCase() || ''
    : fileNameOrExt.toLowerCase();

  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang.extensions.includes(cleanExt)) {
      return lang.monacoLang;
    }
  }

  // Common fallbacks
  if (cleanExt === 'sh' || cleanExt === 'bash') return 'shell';
  if (cleanExt === 'dockerfile') return 'dockerfile';

  return 'javascript';
}

export function getFileBoilerplate(fileName: string): string {
  const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || '' : '';
  const baseName = fileName.split('.')[0] || 'App';
  const capitalized = baseName.charAt(0).toUpperCase() + baseName.slice(1);

  switch (ext) {
    case 'html':
    case 'htm':
      return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${baseName}</title>\n</head>\n<body>\n  <div id="app">\n    <h1>Hello from ${baseName}!</h1>\n  </div>\n</body>\n</html>\n`;
    case 'css':
      return `/* ${fileName} styles */\n:root {\n  --primary: #007acc;\n  --bg: #1e1e1e;\n}\n\nbody {\n  margin: 0;\n  padding: 0;\n  font-family: system-ui, sans-serif;\n}\n`;
    case 'js':
    case 'mjs':
      return `// ${fileName}\nconsole.log("Initialized ${fileName}");\n\nexport function main() {\n  return "Hello World";\n}\n`;
    case 'ts':
      return `// ${fileName}\nexport interface Config {\n  id: string;\n  enabled: boolean;\n}\n\nexport function initialize(config: Config): void {\n  console.log("TS Initialized:", config.id);\n}\n`;
    case 'jsx':
      return `import React from 'react';\n\nexport default function ${capitalized}() {\n  return (\n    <div className="p-4">\n      <h1 className="text-xl font-bold">${capitalized} Component</h1>\n    </div>\n  );\n}\n`;
    case 'tsx':
      return `import React from 'react';\n\ninterface ${capitalized}Props {\n  title?: string;\n}\n\nexport default function ${capitalized}({ title = "${capitalized}" }: ${capitalized}Props) {\n  return (\n    <div className="p-4 border rounded-lg bg-slate-900 text-white">\n      <h2 className="text-lg font-bold">{title}</h2>\n    </div>\n  );\n}\n`;
    case 'vue':
      return `<template>\n  <div className="vue-component">\n    <h1>{{ message }}</h1>\n  </div>\n</template>\n\n<script setup>\nimport { ref } from 'vue';\n\nconst message = ref('Hello Vue 3!');\n</script>\n\n<style scoped>\n.vue-component {\n  padding: 1rem;\n}\n</style>\n`;
    case 'py':
      return `# ${fileName}\nimport sys\n\ndef main():\n    print("Hello from Python!")\n\nif __name__ == "__main__":\n    main()\n`;
    case 'java':
      return `// ${fileName}\npublic class ${capitalized} {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}\n`;
    case 'c':
      return `/* ${fileName} */\n#include <stdio.stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    return 0;\n}\n`;
    case 'cpp':
    case 'hpp':
      return `// ${fileName}\n#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++!" << std::endl;\n    return 0;\n}\n`;
    case 'cs':
      return `// ${fileName}\nusing System;\n\nnamespace Workspace {\n    class ${capitalized} {\n        static void Main(string[] args) {\n            Console.WriteLine("Hello from C#!");\n        }\n    }\n}\n`;
    case 'go':
      return `// ${fileName}\npackage main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello from Go!")\n}\n`;
    case 'rs':
      return `// ${fileName}\nfn main() {\n    println!("Hello from Rust!");\n}\n`;
    case 'php':
      return `<?php\n// ${fileName}\n\necho "Hello from PHP!";\n`;
    case 'rb':
      return `# ${fileName}\ndef main\n  puts "Hello from Ruby!"\nend\n\nmain\n`;
    case 'swift':
      return `// ${fileName}\nimport Foundation\n\nprint("Hello from Swift!")\n`;
    case 'kt':
    case 'kts':
      return `// ${fileName}\nfun main() {\n    println("Hello from Kotlin!")\n}\n`;
    case 'dart':
      return `// ${fileName}\nvoid main() {\n  print('Hello from Dart!');\n}\n`;
    case 'sql':
      return `-- ${fileName}\nSELECT * FROM users WHERE active = true ORDER BY created_at DESC;\n`;
    case 'json':
      return `{\n  "name": "${baseName}",\n  "version": "1.0.0",\n  "description": "JSON configuration file"\n}\n`;
    case 'yaml':
    case 'yml':
      return `# ${fileName}\nversion: '3.8'\nservices:\n  app:\n    image: node:18-alpine\n    ports:\n      - "3000:3000"\n`;
    case 'md':
      return `# ${capitalized}\n\nWelcome to **${fileName}**.\n\n- Feature 1\n- Feature 2\n- Feature 3\n`;
    case 'xml':
      return `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item id="1">Hello from XML</item>\n</root>\n`;
    default:
      return `// ${fileName}\n`;
  }
}
