/**
 * Vue.js Framework Specialist
 * Provides Vue-specific reasoning patterns for the Hierarchical Reasoning system.
 * Focuses on Composition API, reactivity system, and modern Vue 3 patterns.
 */

export interface VueReasoningContext {
  /** Component API style: Options API, Composition API, or script setup */
  apiStyle?: "options" | "composition" | "script_setup";
  /** Reactivity approach: ref, reactive, computed, watch */
  reactivityAPI?: "ref" | "reactive" | "computed" | "watch" | "mixed";
  /** Component type: SFC, functional, or async */
  componentType?: "sfc" | "functional" | "async";
  /** State management solution */
  stateManagement?: "pinia" | "vuex" | "provide_inject" | "local";
  /** Build tool being used */
  buildTool?: "vite" | "webpack" | "rollup";
  /** Performance concerns */
  performanceConcerns?: string[];
  /** Testing framework */
  testingFramework?: "vitest" | "jest" | "cypress" | "playwright";
  /** TypeScript usage */
  typeScript?: boolean;
}

export interface VueReasoningResult {
  framework: "vue";
  problemCategory: string;
  reasoning: string[];
  patterns: ReasoningPattern[];
  recommendations: string[];
  codeExamples: string[];
}

export interface ReasoningPattern {
  name: string;
  description: string;
  guidance: string;
  examples: string[];
}

const PATTERNS: ReasoningPattern[] = [
  {
    name: "Ref vs Reactive Selection",
    description: "Choose between ref and reactive based on data structure and usage patterns.",
    guidance:
      "Use ref for primitives and values that need .value access. Use reactive for objects when you want nested reactivity without .value. Avoid mixing patterns within the same component.",
    examples: [
      `// Ref for primitives - explicit .value access\nconst count = ref(0)\nconst increment = () => count.value++\n\n// Reactive for objects - no .value needed\nconst state = reactive({\n  user: { name: 'Alice', age: 30 },\n  settings: { theme: 'dark' }\n})\nstate.user.age++`,
      `// Computed with refs\nconst firstName = ref('John')\nconst lastName = ref('Doe')\nconst fullName = computed(() => \`\${firstName.value} \${lastName.value}\`)`,
      `// Watch for side effects\nwatch(count, (newVal, oldVal) => {\n  console.log(\`Count changed from \${oldVal} to \${newVal}\`)\n  localStorage.setItem('count', String(newVal))\n})`,
    ],
  },
  {
    name: "Composables Pattern",
    description: "Extract and reuse stateful logic using composable functions.",
    guidance:
      "Create composables for shared logic like data fetching, form handling, or feature-specific state. Follow naming convention useX(). Return reactive state and methods. Composables can call other composables.",
    examples: [
      `// useCounter.ts - Reusable counter logic\nexport function useCounter(initialValue = 0) {\n  const count = ref(initialValue)\n  const increment = () => count.value++\n  const decrement = () => count.value--\n  const reset = () => count.value = initialValue\n  \n  return { count, increment, decrement, reset }\n}`,
      `// useFetch.ts - Generic data fetching\nexport function useFetch<T>(url: string) {\n  const data = ref<T | null>(null)\n  const error = ref<Error | null>(null)\n  const loading = ref(false)\n  \n  const fetch = async () => {\n    loading.value = true\n    error.value = null\n    try {\n      const response = await fetch(url)\n      data.value = await response.json()\n    } catch (e) {\n      error.value = e as Error\n    } finally {\n      loading.value = false\n    }\n  }\n  \n  onMounted(fetch)\n  \n  return { data, error, loading, refetch: fetch }\n}`,
      `// Usage in component\n<script setup>\nimport { useCounter } from './composables/useCounter'\nimport { useFetch } from './composables/useFetch'\n\nconst { count, increment } = useCounter(10)\nconst { data: users, loading } = useFetch('/api/users')\n</script>`,
    ],
  },
  {
    name: "Component Composition Patterns",
    description: "Structure components for reusability and maintainability using SFC and composition.",
    guidance:
      "Prefer <script setup> for cleaner syntax. Break large components into smaller composables and child components. Use props for parent-child communication, emit for child-parent. Use provide/inject for deep hierarchies.",
    examples: [
      `// Parent Component with props and emits\n<script setup lang="ts">\nimport { ref } from 'vue'\nimport ChildComponent from './ChildComponent.vue'\n\ninterface Props {\n  title: string\n  initialCount?: number\n}\n\nconst props = withDefaults(defineProps<Props>(), {\n  initialCount: 0\n})\n\nconst emit = defineEmits<{\n  update: [count: number]\n  reset: []\n}>()\n\nconst count = ref(props.initialCount)\n\nconst handleIncrement = () => {\n  count.value++\n  emit('update', count.value)\n}\n</script>`,
      `// Provide/Inject for deep component trees\n// Parent\nconst theme = ref('dark')\nprovide('theme', theme)\n\n// Deep child\nconst theme = inject<Ref<string>>('theme')`,
      `// Slots for flexible composition\n<template>\n  <div class="card">\n    <header><slot name="header"></slot></header>\n    <main><slot></slot></main>\n    <footer><slot name="footer"></slot></footer>\n  </div>\n</template>`,
    ],
  },
  {
    name: "Performance Optimization",
    description: "Optimize rendering and reactivity for better performance.",
    guidance:
      "Use computed for derived state instead of methods in templates. Leverage v-memo for expensive lists. Use shallowRef/shallowReactive for large objects. Implement component lazy loading with defineAsyncComponent.",
    examples: [
      `// Computed caching vs methods\n// ✅ Good - cached, only recomputes when dependencies change\nconst expensiveValue = computed(() => {\n  return items.value.reduce((sum, item) => sum + item.price, 0)\n})\n\n// ❌ Bad - recalculates on every render\nconst expensiveValue = () => {\n  return items.value.reduce((sum, item) => sum + item.price, 0)\n}`,
      `// v-memo for large lists\n<template>\n  <div v-for="item in list" :key="item.id" v-memo="[item.id, item.selected]">\n    <!-- Only re-renders if id or selected changes -->\n  </div>\n</template>`,
      `// Shallow reactivity for large objects\nimport { shallowRef, triggerRef } from 'vue'\n\nconst largeObject = shallowRef({\n  nested: { deeply: { data: [...] } }\n})\n\n// Modify and manually trigger\nlargeObject.value.nested.deeply.data.push(newItem)\ntriggerRef(largeObject)`,
      `// Lazy loading components\nconst HeavyChart = defineAsyncComponent(() =>\n  import('./components/HeavyChart.vue')\n)\n\n// With loading/error states\nconst AsyncComponent = defineAsyncComponent({\n  loader: () => import('./Heavy.vue'),\n  loadingComponent: LoadingSpinner,\n  errorComponent: ErrorDisplay,\n  delay: 200,\n  timeout: 3000\n})`,
    ],
  },
  {
    name: "State Management with Pinia",
    description: "Manage global state using Pinia with Composition API pattern.",
    guidance:
      "Define stores using setup syntax for better TypeScript support. Use getters for computed state, actions for mutations. Leverage store composition for modularity.",
    examples: [
      `// stores/user.ts\nimport { defineStore } from 'pinia'\nimport { ref, computed } from 'vue'\n\nexport const useUserStore = defineStore('user', () => {\n  // State\n  const user = ref<User | null>(null)\n  const token = ref<string | null>(null)\n  \n  // Getters\n  const isAuthenticated = computed(() => !!token.value)\n  const fullName = computed(() => \n    user.value ? \`\${user.value.firstName} \${user.value.lastName}\` : ''\n  )\n  \n  // Actions\n  async function login(credentials: Credentials) {\n    const response = await api.login(credentials)\n    user.value = response.user\n    token.value = response.token\n  }\n  \n  function logout() {\n    user.value = null\n    token.value = null\n  }\n  \n  return { user, token, isAuthenticated, fullName, login, logout }\n})`,
      `// Store composition - using other stores\nimport { useUserStore } from './user'\n\nexport const useCartStore = defineStore('cart', () => {\n  const userStore = useUserStore()\n  const items = ref<CartItem[]>([])\n  \n  const canCheckout = computed(() => \n    userStore.isAuthenticated && items.value.length > 0\n  )\n  \n  return { items, canCheckout }\n})`,
    ],
  },
  {
    name: "TypeScript Integration",
    description: "Leverage TypeScript for type-safe Vue components and composables.",
    guidance:
      "Use <script setup lang=\"ts\"> for automatic type inference. Define prop types with TypeScript interfaces. Type composable returns explicitly.",
    examples: [
      `<script setup lang="ts">\nimport { ref, computed } from 'vue'\n\ninterface User {\n  id: number\n  name: string\n  email: string\n}\n\ninterface Props {\n  userId: number\n  showEmail?: boolean\n}\n\nconst props = withDefaults(defineProps<Props>(), {\n  showEmail: true\n})\n\nconst user = ref<User | null>(null)\n\n// Type-safe computed\nconst displayName = computed((): string => {\n  return user.value?.name ?? 'Unknown User'\n})\n</script>`,
      `// Type-safe composable\nexport function useApi<T>() {\n  const data = ref<T | null>(null)\n  const error = ref<Error | null>(null)\n  const loading = ref(false)\n  \n  async function fetch(url: string): Promise<void> {\n    loading.value = true\n    try {\n      const response = await fetch(url)\n      data.value = await response.json() as T\n    } catch (e) {\n      error.value = e as Error\n    } finally {\n      loading.value = false\n    }\n  }\n  \n  return { data, error, loading, fetch }\n}`,
    ],
  },
];

const CATEGORY_KEYWORDS: Record<string, RegExp[]> = {
  performance: [
    /performance/i,
    /slow/i,
    /optimize/i,
    /rendering/i,
    /re-?render/i,
    /lag/i,
    /delay/i,
    /large list/i,
    /memory/i,
  ],
  reactivity: [
    /reactive/i,
    /ref/i,
    /state/i,
    /update/i,
    /watch/i,
    /computed/i,
    /reactivity/i,
  ],
  composition: [
    /composable/i,
    /reuse/i,
    /share.*logic/i,
    /extract/i,
    /hook/i,
    /composition api/i,
  ],
  stateManagement: [
    /state.*management/i,
    /pinia/i,
    /vuex/i,
    /global.*state/i,
    /store/i,
  ],
  testing: [
    /test/i,
    /testing/i,
    /vitest/i,
    /jest/i,
    /unit.*test/i,
    /component.*test/i,
  ],
  typescript: [
    /typescript/i,
    /type.*safe/i,
    /typing/i,
    /interface/i,
    /type.*error/i,
  ],
};

export class VueFrameworkSpecialist {
  async generateVueSpecificReasoning(
    problem: string,
    context: VueReasoningContext,
    codeContext?: string
  ): Promise<VueReasoningResult> {
    const category = this.categorize(problem);
    const contextSummary = this.buildContextSummary(context);
    const selectedPatterns = this.selectPatterns(category, context);
    const recommendations = this.generateRecommendations(category, context);
    const examples = this.generateExamples(category);

    const reasoning: string[] = [
      `Analyzing Vue.js ${category} problem:`,
      `Context: ${contextSummary}`,
      `Recommended approach: ${selectedPatterns.map((p) => p.name).join(", ")}`,
    ];

    if (codeContext) {
      const codeAnalysis = this.generateCodeContextSummary(codeContext);
      reasoning.push(`Code analysis: ${codeAnalysis}`);
    }

    return {
      framework: "vue",
      problemCategory: category,
      reasoning,
      patterns: selectedPatterns,
      recommendations,
      codeExamples: examples,
    };
  }

  private categorize(problem: string): string {
    for (const [category, patterns] of Object.entries(CATEGORY_KEYWORDS)) {
      if (patterns.some((regex) => regex.test(problem))) {
        return category;
      }
    }
    return "general";
  }

  private buildContextSummary(context: VueReasoningContext): string {
    const parts: string[] = [];

    if (context.apiStyle) {
      parts.push(`using ${context.apiStyle} API`);
    }
    if (context.reactivityAPI) {
      parts.push(`${context.reactivityAPI} for reactivity`);
    }
    if (context.stateManagement) {
      parts.push(`${context.stateManagement} for state`);
    }
    if (context.buildTool) {
      parts.push(`built with ${context.buildTool}`);
    }
    if (context.typeScript) {
      parts.push("TypeScript enabled");
    }

    return parts.length > 0 ? parts.join(", ") : "default Vue 3 setup";
  }

  private selectPatterns(category: string, context: VueReasoningContext): ReasoningPattern[] {
    const categoryPatternMap: Record<string, string[]> = {
      performance: ["Performance Optimization", "Component Composition Patterns"],
      reactivity: ["Ref vs Reactive Selection"],
      composition: ["Composables Pattern", "Component Composition Patterns"],
      stateManagement: ["State Management with Pinia"],
      typescript: ["TypeScript Integration"],
    };

    const patternNames = categoryPatternMap[category] || ["Composables Pattern"];
    return PATTERNS.filter((p) => patternNames.includes(p.name));
  }

  private generateRecommendations(category: string, context: VueReasoningContext): string[] {
    const recommendations: string[] = [];

    // Category-specific recommendations
    if (category === "performance") {
      recommendations.push(
        "Use computed properties instead of methods in templates for automatic caching",
        "Consider v-memo for expensive list items that rarely change",
        "Implement component lazy loading with defineAsyncComponent for large components"
      );
      if (!context.buildTool || context.buildTool === "vite") {
        recommendations.push("Leverage Vite's automatic code splitting for optimal bundle size");
      }
    } else if (category === "reactivity") {
      recommendations.push(
        "Use ref for primitive values and reactive for objects",
        "Avoid losing reactivity by destructuring reactive objects - use toRefs() instead",
        "Use computed for derived state instead of watchers when possible"
      );
    } else if (category === "composition") {
      recommendations.push(
        "Extract reusable logic into composables following the useX naming convention",
        "Composables can call other composables for better code organization",
        "Return reactive refs and methods from composables, not plain values"
      );
    } else if (category === "stateManagement") {
      recommendations.push(
        "Use Pinia over Vuex for Vue 3 applications - better TypeScript support",
        "Define stores using setup syntax with composition API pattern",
        "Leverage store composition to use other stores within a store"
      );
    } else if (category === "typescript") {
      recommendations.push(
        "Use <script setup lang=\"ts\"> for automatic type inference",
        "Define prop types with TypeScript interfaces instead of PropType",
        "Type composable returns explicitly for better IDE support"
      );
    }

    // Context-based recommendations
    if (context.apiStyle === "options") {
      recommendations.push(
        "Consider migrating to Composition API or <script setup> for better code organization and TypeScript support"
      );
    }

    if (context.stateManagement === "vuex") {
      recommendations.push("Consider migrating from Vuex to Pinia for improved TypeScript support");
    }

    if (!context.typeScript) {
      recommendations.push(
        "Consider enabling TypeScript for better type safety and IDE support"
      );
    }

    return recommendations;
  }

  private generateExamples(category: string): string[] {
    const pattern = PATTERNS.find((p) => {
      if (category === "performance") return p.name === "Performance Optimization";
      if (category === "reactivity") return p.name === "Ref vs Reactive Selection";
      if (category === "composition") return p.name === "Composables Pattern";
      if (category === "stateManagement") return p.name === "State Management with Pinia";
      if (category === "typescript") return p.name === "TypeScript Integration";
      return false;
    });

    return pattern?.examples || PATTERNS[1].examples; // Default to Composables
  }

  private generateCodeContextSummary(codeContext: string): string {
    const insights: string[] = [];

    if (/<script\s+setup>/i.test(codeContext)) {
      insights.push("Using <script setup> syntax");
    } else if (/defineComponent/i.test(codeContext)) {
      insights.push("Using Options API with defineComponent");
    }

    if (/\bref\(/i.test(codeContext)) {
      insights.push("Using ref for reactivity");
    }
    if (/\breactive\(/i.test(codeContext)) {
      insights.push("Using reactive for objects");
    }
    if (/\bcomputed\(/i.test(codeContext)) {
      insights.push("Using computed properties");
    }
    if (/\bwatch\(/i.test(codeContext)) {
      insights.push("Using watchers");
    }

    if (/usePinia|defineStore/i.test(codeContext)) {
      insights.push("Pinia state management detected");
    }

    if (/lang=["']ts["']/i.test(codeContext)) {
      insights.push("TypeScript enabled");
    }

    return insights.length > 0
      ? insights.join("; ")
      : "Standard Vue component structure";
  }
}
