export interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  language: 'html' | 'javascript';
  category: string;
  code: string;
}

export const CODE_SNIPPETS: CodeSnippet[] = [
  // --- HTML SNIPPETS ---
  {
    id: 'html-hero',
    title: 'Modern Hero Banner',
    description: 'A visually stunning full-width landing section with glassmorphism, gradient accents, and responsive text layout.',
    language: 'html',
    category: 'Layout & Headers',
    code: `<!-- Modern Landing Hero Section -->
<div class="relative min-h-[500px] flex items-center justify-center bg-slate-950 text-white overflow-hidden py-12 px-6">
  <!-- Dynamic blurred fluid background circles -->
  <div class="absolute top-0 -left-4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl opacity-60"></div>
  <div class="absolute bottom-0 -right-4 w-96 h-96 bg-indigo-505/20 bg-indigo-500/10 rounded-full blur-3xl opacity-60"></div>

  <div class="max-w-4xl text-center z-10">
    <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full mb-6">
      <span class="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
      Version 2.4 Live Edition
    </span>

    <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent">
      Design Interactive Prototypes <br class="hidden md:inline"/> Real-time Together
    </h1>

    <p class="mt-6 text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
      Unlock visual collaboration inside LivePad. Write modern interactive templates, customize with instant Tailwind support, and preview results collaboratively.
    </p>

    <div class="mt-8 flex flex-wrap justify-center gap-4">
      <button class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
        Get Started Free
      </button>
      <button class="px-6 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
        Learn More
      </button>
    </div>
  </div>
</div>`
  },
  {
    id: 'html-bento',
    title: 'Bento Grid Layout',
    description: 'An elegant dashboard card grid showcasing various widget items (charts, metrics, statuses) using responsive CSS grid.',
    language: 'html',
    category: 'Dashboard Panels',
    code: `<!-- Bento Grid Layout -->
<div class="py-8 px-4 max-w-5xl mx-auto bg-slate-50 dark:bg-zinc-950 transition-colors duration-200 rounded-3xl">
  <div class="mb-6">
    <h3 class="text-xs uppercase font-extrabold tracking-wider text-rose-500">Live Services Dashboard</h3>
    <h2 class="text-2xl font-black text-slate-800 dark:text-white leading-tight">LivePad Real-time Sync Status</h2>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- Box 1: Highlights (spanning 2 columns) -->
    <div class="md:col-span-2 bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/10 rounded-2xl p-6 min-h-[160px] flex flex-col justify-between">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-indigo-400 font-mono bg-indigo-900/30 px-2 py-0.5 rounded">BANDWIDTH LIMIT</span>
        <span class="text-emerald-400 text-xs font-extrabold flex items-center gap-1">● Optimal</span>
      </div>
      <div>
        <h3 class="text-3xl font-black text-white mt-4">98.4 GB / Sec</h3>
        <p class="text-indigo-200/60 text-xs mt-1">Direct peer-to-peer WebRTC signaling data throughput over cloud instances.</p>
      </div>
    </div>

    <!-- Box 2: Single stats -->
    <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between">
      <div class="text-slate-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">Active Rooms</div>
      <div>
        <h3 class="text-4xl font-extrabold text-slate-800 dark:text-white">1,482</h3>
        <p class="text-emerald-500 text-xs mt-2 font-medium flex items-center gap-1">
          ↑ +14% this hour
        </p>
      </div>
    </div>

    <!-- Box 3: Live updates stream -->
    <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between min-h-[170px]">
      <div class="text-slate-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">Sync Latency</div>
      <div>
        <div class="flex items-end gap-1 mb-2 h-12">
          <div class="flex-1 bg-indigo-600/30 rounded-xs h-6"></div>
          <div class="flex-1 bg-indigo-600/40 rounded-xs h-8"></div>
          <div class="flex-1 bg-indigo-600/30 rounded-xs h-5"></div>
          <div class="flex-1 bg-indigo-600/50 rounded-xs h-10"></div>
          <div class="flex-1 bg-indigo-600/80 rounded-xs h-11"></div>
          <div class="flex-1 bg-indigo-600 rounded-xs h-4"></div>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-zinc-400">Average synchronization ping is <strong>4ms</strong>.</p>
      </div>
    </div>

    <!-- Box 4: Feature status list (spanning 2 columns) -->
    <div class="md:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-6">
      <div class="text-slate-700 dark:text-zinc-300 font-bold text-sm mb-4">Instance Heath Metrics</div>
      <div class="space-y-3">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-500 dark:text-zinc-400">Postgres Cluster db-01</span>
          <span class="font-mono font-bold text-emerald-500">99.98% / Healthy</span>
        </div>
        <div class="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5">
          <div class="bg-emerald-500 h-1.5 rounded-full" style="width: 99.98%"></div>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-500 dark:text-zinc-400">Microphone Socket Shard</span>
          <span class="font-mono font-bold text-indigo-500">99.40% / Optimized</span>
        </div>
        <div class="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5">
          <div class="bg-indigo-500 h-1.5 rounded-full" style="width: 99.40%"></div>
        </div>
      </div>
    </div>
  </div>
</div>`
  },
  {
    id: 'html-faq',
    title: 'Interactive Accordion FAQ',
    description: 'Clean click-to-expand list items that use vanilla JS listeners to handle smooth transitions and rotation symbols.',
    language: 'html',
    category: 'Interactive Components',
    code: `<!-- Interactive FAQs Accordion -->
<div class="max-w-xl mx-auto py-8">
  <div class="text-center mb-8">
    <h2 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Frequently Asked Questions</h2>
    <p class="text-sm text-slate-500 dark:text-zinc-400 mt-1">Get instant details about how the LivePad engine collaborates.</p>
  </div>

  <div class="space-y-3">
    <!-- Item 1 -->
    <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
      <button class="faq-btn w-full px-5 py-4 flex items-center justify-between text-left focus:outline-hidden transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/40">
        <span class="text-sm font-bold text-slate-700 dark:text-zinc-200">How does real-time document synchronization work?</span>
        <span class="faq-icon text-slate-400 transform transition-transform duration-300">▼</span>
      </button>
      <div class="faq-content max-h-0 overflow-hidden transition-all duration-300 bg-slate-50/50 dark:bg-zinc-900/40">
        <p class="p-5 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-zinc-800">
          We stream delta edits through a Firebase Firestore backend or native collaborative hooks, attaching multi-user cursor coordinates synchronously.
        </p>
      </div>
    </div>

    <!-- Item 2 -->
    <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
      <button class="faq-btn w-full px-5 py-4 flex items-center justify-between text-left focus:outline-hidden transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/40">
        <span class="text-sm font-bold text-slate-700 dark:text-zinc-200">Can I write React components inside LivePad?</span>
        <span class="faq-icon text-slate-400 transform transition-transform duration-300">▼</span>
      </button>
      <div class="faq-content max-h-0 overflow-hidden transition-all duration-300 bg-slate-50/50 dark:bg-zinc-900/40">
        <p class="p-5 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-zinc-800">
          The Sandbox mode is configured for plain HTML/JS and loaded Tailwind CSS engines. If you want React, you can load React libraries inside standard script imports.
        </p>
      </div>
    </div>

    <!-- Item 3 -->
    <div class="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
      <button class="faq-btn w-full px-5 py-4 flex items-center justify-between text-left focus:outline-hidden transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/40">
        <span class="text-sm font-bold text-slate-700 dark:text-zinc-200">Is code dictation secure?</span>
        <span class="faq-icon text-slate-400 transform transition-transform duration-300">▼</span>
      </button>
      <div class="faq-content max-h-0 overflow-hidden transition-all duration-300 bg-slate-50/50 dark:bg-zinc-900/40">
        <p class="p-5 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-zinc-800">
          Yes! Speech transcription compiles completely inside standard browsers using Google web sandboxing APIs without streaming background recordings to remote third party relays.
        </p>
      </div>
    </div>
  </div>
</div>

<script>
  // Add collapse listener toggles
  document.querySelectorAll('.faq-btn').forEach(button => {
    button.addEventListener('click', () => {
      const parent = button.parentElement;
      const content = parent.querySelector('.faq-content');
      const icon = parent.querySelector('.faq-icon');
      
      const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';
      
      // Close all first for accordion behavior
      document.querySelectorAll('.faq-content').forEach(c => c.style.maxHeight = '0px');
      document.querySelectorAll('.faq-icon').forEach(i => i.style.transform = 'rotate(0deg)');
      
      if (!isOpen) {
        content.style.maxHeight = content.scrollHeight + 'px';
        icon.style.transform = 'rotate(180deg)';
      }
    });
  });
</script>`
  },
  {
    id: 'html-modal',
    title: 'Sleek Overlaid Drawer/Modal',
    description: 'An interactive overlay drawer or popup displaying details, animated seamlessly with HTML utility and toggles.',
    language: 'html',
    category: 'Interactive Components',
    code: `<!-- Clickable Modal Popup -->
<div class="flex flex-col items-center justify-center py-10">
  <button id="open-modal-btn" class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/10 cursor-pointer active:scale-95 transition-all">
    Show Promo Dialog
  </button>

  <!-- Backdrop (Hidden by default) -->
  <div id="modal-container" class="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-300 opacity-0 pointer-events-none">
    
    <!-- Modal Card -->
    <div id="modal-card" class="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl transform scale-90 transition-all duration-300 text-center">
      <div class="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center text-xl mb-4">
        ★
      </div>
      
      <h3 class="text-lg font-black text-slate-800 dark:text-neutral-100">Congratulations!</h3>
      <p class="text-xs text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
        You successfully executed live interactive elements inside your sandboxed design space. Share the room with collaborators!
      </p>

      <div class="mt-6 flex gap-3">
        <button id="close-modal-btn" class="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-all">
          Cancel
        </button>
        <button id="ok-modal-btn" class="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-rose-600/10 transition-all">
          Accept Promo
        </button>
      </div>
    </div>
  </div>
</div>

<script>
  const container = document.getElementById('modal-container');
  const card = document.getElementById('modal-card');
  const openBtn = document.getElementById('open-modal-btn');
  const closeBtn = document.getElementById('close-modal-btn');
  const okBtn = document.getElementById('ok-modal-btn');

  const openModal = () => {
    container.classList.remove('opacity-0', 'pointer-events-none');
    card.classList.remove('scale-90');
    card.classList.add('scale-100');
  };

  const closeModal = () => {
    container.classList.add('opacity-0', 'pointer-events-none');
    card.classList.remove('scale-100');
    card.classList.add('scale-90');
  };

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  okBtn.addEventListener('click', () => {
    alert('Promo code accepted!');
    closeModal();
  });

  // Close outer backdrop too
  container.addEventListener('click', (e) => {
    if (e.target === container) closeModal();
  });
</script>`
  },

  // --- JAVASCRIPT SNIPPETS ---
  {
    id: 'js-fetch-retry',
    title: 'Async Fetch with Retries',
    description: 'An advanced micro-function executing a Fetch request that automatically retries upon failure with back-off logging.',
    language: 'javascript',
    category: 'Network Operations',
    code: `// Async Fetch request with auto-retry of service failures
async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
  try {
    console.log(\`Attempting fetch request to URL... (Remaining retries: \${retries})\`);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(\`Network response failed with code: \${response.status}\`);
    }
    
    const data = await response.json();
    console.info("⚡ Success: API fetch succeeded!");
    return data;
  } catch (error) {
    if (retries > 0) {
      console.warn(\`Error occurred: \${error.message}. Retrying in \${delay}ms...\`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    } else {
      console.error("❌ Ultimate Failure: All fetch retries exhausted.");
      throw error;
    }
  }
}

// Demo running on public placeholder API
fetchWithRetry("https://jsonplaceholder.typicode.com/todos/1")
  .then(todo => console.log("Fetched Todo Item:", todo))
  .catch(err => console.error("Unhandled error context:", err));
`
  },
  {
    id: 'js-debounce',
    title: 'Input Debouncer Helper',
    description: 'A standard debounce utility function with simulation framework to capture rapid keystroke calls.',
    language: 'javascript',
    category: 'System Utilities',
    code: `// Debounce helper to restrict rate of intensive function calls
function debounce(func, waitDelay) {
  let timeoutId = null;
  
  return function(...args) {
    const context = this;
    
    // Clear out earlier timers immediately
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, waitDelay);
  };
}

// Simulate user searches in real-time input fields
const performQuerySearch = (queryText) => {
  console.info(\`[EXECUTION] Fetching search database results for term: "\${queryText}"\`);
};

const debouncedQuerySearch = debounce(performQuerySearch, 300);

console.log("⌨️ User begins rapid keyboard input entries...");
debouncedQuerySearch("D");
debouncedQuerySearch("De");
debouncedQuerySearch("Debo");
debouncedQuerySearch("Deboun");
debouncedQuerySearch("Debouncing Utilities"); // Only this final statement executes after 300ms delay!
`
  },
  {
    id: 'js-array-groupby',
    title: 'Array GroupBy Classifier',
    description: 'Filters, transforms, and classifies records in an object group list for analytical sorting.',
    language: 'javascript',
    category: 'Data Structures',
    code: `// Custom dynamic list classifier to aggregate records
function groupBy(list, keyGetter) {
  const map = {};
  list.forEach((item) => {
    const key = keyGetter(item);
    if (!map[key]) {
      map[key] = [];
    }
    map[key].push(item);
  });
  return map;
}

// Sample collaborative team workspace log data
const livePadRooms = [
  { id: "ROOM-1-X", code: "NOTE55", activeUsers: 4, label: "Work", sizeBytes: 1540 },
  { id: "ROOM-2-B", code: "STUDY7", activeUsers: 2, label: "Study", sizeBytes: 840 },
  { id: "ROOM-3-O", code: "HACK99", activeUsers: 6, label: "Work", sizeBytes: 5200 },
  { id: "ROOM-4-M", code: "SELF01", activeUsers: 1, label: "Personal", sizeBytes: 310 },
  { id: "ROOM-5-U", code: "EXAM23", activeUsers: 0, label: "Study", sizeBytes: 0 },
];

console.log("📂 Original workspace room lists size:", livePadRooms.length);

// Group standard items by labels
const groupedByLabel = groupBy(livePadRooms, room => room.label);
console.log("🏷️ Rooms grouped by labeled category:", groupedByLabel);

// Filter rooms that are actively shared and calculate storage sizes
const activeRoomsSum = livePadRooms
  .filter(r => r.activeUsers > 0)
  .reduce((sum, r) => sum + r.sizeBytes, 0);

console.info(\`💾 Accumulated data footprint in active rooms: \${activeRoomsSum} bytes\`);
`
  },
  {
    id: 'js-pubsub',
    title: 'PubSub Custom Messenger',
    description: 'An elegant JavaScript Publish-Subscribe event bus class demonstrating listener registration and event dispatching.',
    language: 'javascript',
    category: 'System Utilities',
    code: `// Publish-Subscribe Class framework
class EventBus {
  constructor() {
    this.topics = {};
  }

  // Register listener for a topic
  subscribe(topic, listener) {
    if (!this.topics[topic]) {
      this.topics[topic] = [];
    }
    const index = this.topics[topic].push(listener) - 1;
    console.log(\`✔️ Subscribed listener to [\${topic}] topic.\`);
    
    // Return unsubscribe callback
    return {
      unsubscribe: () => {
        this.topics[topic].splice(index, 1);
        console.warn(\`❌ Removed listener from [\${topic}] topic.\`);
      }
    };
  }

  // Publish event broadcasts with args
  publish(topic, data) {
    if (!this.topics[topic] || this.topics[topic].length === 0) {
      console.info(\`⚠️ Dispatch ignored. No active listeners on topic: [\${topic}]\`);
      return;
    }
    
    this.topics[topic].forEach(listener => {
      try {
        listener(data);
      } catch (e) {
        console.error(\`Err callback: \${e.message}\`);
      }
    });
  }
}

// Deploy Custom Event Bus inside Sandbox environment
const portalBus = new EventBus();

// Create multiple listener scopes
const analyticsSub = portalBus.subscribe("USER_SYNCED", (payload) => {
  console.log(\`📈 [Analytics Module] Captured sync event for user: \${payload.username} (Room: \${payload.code})\`);
});

const notificationSub = portalBus.subscribe("USER_SYNCED", (payload) => {
  console.info(\`🔔 [Notifications] Ring sound for incoming member sync: \${payload.username}\`);
});

// Broadcast user sync operations
portalBus.publish("USER_SYNCED", { username: "Bibek Bista", code: "NOTE55" });

// Unsubscribe one listener and fire again
notificationSub.unsubscribe();
portalBus.publish("USER_SYNCED", { username: "Dev Coding Agent", code: "HACK99" });
`
  },
  {
    id: 'js-sort-performance',
    title: 'Sorting Speed Benchmarker',
    description: 'Compares classic Bubble Sort vs JavaScript Array.sort speeds on a randomized array dataset.',
    language: 'javascript',
    category: 'Algorithms',
    code: `// Compare Sorting algorithms execution delays
function bubbleSort(inputArray) {
  const arr = [...inputArray];
  const len = arr.length;
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

// Generate randomized sample arrays
const elementCount = 1200;
const testArray = Array.from({ length: elementCount }, () => Math.floor(Math.random() * 10000));

console.log(\`📊 Comparing sorting speeds across \${elementCount} random integers...\`);

// Benchmark 1: Classic Bubble Sort
const bubbleStart = Date.now();
const bubbleSorted = bubbleSort(testArray);
const bubbleEnd = Date.now();
const bubbleDuration = bubbleEnd - bubbleStart;
console.log(\`🐢 Bubble Sort complete. Time elapsed: \${bubbleDuration}ms\`);

// Benchmark 2: Optimized Native Browser JIT Sort
const nativeStart = Date.now();
const nativeSorted = [...testArray].sort((a, b) => a - b);
const nativeEnd = Date.now();
const nativeDuration = nativeEnd - nativeStart;
console.log(\`⚡ Native Array.proto.sort complete. Time elapsed: \${nativeDuration}ms\`);

const multiplier = (bubbleDuration / (nativeDuration || 1)).toFixed(1);
console.info(\`🚀 JIT native sort is roughly \${multiplier}x faster than standard quadratic Bubble Sort!\`);
`
  }
];
