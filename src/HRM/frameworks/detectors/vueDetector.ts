import { DetectionContext, DetectionResult, FrameworkCapability } from "../types.js";
import { FrameworkDetector } from "./baseDetector.js";

export class VueDetector extends FrameworkDetector {
  async detect(context: DetectionContext) {
    const indicators: DetectionResult[] = [
      {
        type: "dependency",
        pattern: "vue",
        weight: 0.4,
        matched: this.hasRuntimeDependency(context, "vue"),
      },
      {
        type: "dependency",
        pattern: "@vue/composition-api",
        weight: 0.2,
        matched: this.hasRuntimeDependency(context, "@vue/composition-api"),
      },
      {
        type: "file_pattern",
        pattern: "src/components",
        weight: 0.15,
        matched: this.hasFileContaining(context, /src[\\/](components|composables|views)/i),
      },
      {
        type: "file_pattern",
        pattern: ".vue files",
        weight: 0.15,
        matched: this.hasFileContaining(context, /\.vue$/i),
      },
      {
        type: "code_pattern",
        pattern: "vue_component",
        weight: 0.1,
        matched: this.hasCodePattern(context, "vue_component"),
      },
    ];

    const confidence = this.calculateConfidence(indicators);
    if (confidence < 0.35) {
      return null;
    }

    const version = this.getVersion(context, "vue");
    const capabilities: FrameworkCapability[] = [
      {
        category: "ui",
        features: ["component_model", "composition_api", "reactivity", "sfc"],
        patterns: [
          {
            name: "Composition API",
            description: "Use Vue 3's Composition API for better code organization and TypeScript support.",
            guidance: "Prefer <script setup> syntax with ref, reactive, and computed for cleaner code.",
            examples: [
              `<script setup>\nimport { ref, computed } from 'vue'\nconst count = ref(0)\nconst doubled = computed(() => count.value * 2)\n</script>`,
            ],
          },
          {
            name: "Reactivity System",
            description: "Leverage Vue's reactivity system with ref and reactive.",
            guidance: "Use ref for primitives, reactive for objects. Access ref values with .value.",
            examples: [
              `const state = reactive({ count: 0 })\nconst message = ref('Hello')`,
            ],
          },
          {
            name: "Composables Pattern",
            description: "Extract reusable logic into composable functions.",
            guidance: "Create composables for shared stateful logic, similar to React hooks.",
            examples: [
              `export function useCounter() {\n  const count = ref(0)\n  const increment = () => count.value++\n  return { count, increment }\n}`,
            ],
          },
        ],
      },
      {
        category: "state_management",
        features: ["pinia", "vuex", "provide_inject"],
        patterns: [
          {
            name: "Pinia State Management",
            description: "Use Pinia for modern, type-safe state management.",
            guidance: "Prefer Pinia over Vuex for Vue 3 applications. Use stores with composition API pattern.",
            examples: [
              `export const useCounterStore = defineStore('counter', () => {\n  const count = ref(0)\n  const increment = () => count.value++\n  return { count, increment }\n})`,
            ],
          },
          {
            name: "Provide/Inject Pattern",
            description: "Use provide/inject for dependency injection.",
            guidance: "Provide data at parent level, inject at descendant level for loose coupling.",
          },
        ],
      },
      {
        category: "routing",
        features: ["vue_router"],
        patterns: [
          {
            name: "Vue Router Navigation",
            description: "Implement client-side routing with Vue Router.",
            guidance: "Use composables like useRouter and useRoute in Composition API.",
          },
        ],
      },
      {
        category: "performance",
        features: ["computed_caching", "watchers", "lazy_loading"],
        patterns: [
          {
            name: "Computed Properties",
            description: "Use computed for derived state with automatic caching.",
            guidance: "Computed properties cache based on dependencies and only recompute when needed.",
          },
          {
            name: "Component Lazy Loading",
            description: "Lazy load components with defineAsyncComponent.",
            guidance: "Split large components into async chunks for better initial load performance.",
            examples: [
              `const AsyncComponent = defineAsyncComponent(() => import('./HeavyComponent.vue'))`,
            ],
          },
        ],
      },
      {
        category: "testing",
        features: ["vitest", "vue_test_utils"],
        patterns: [
          {
            name: "Vue Test Utils",
            description: "Test components with @vue/test-utils and Vitest.",
            guidance: "Mount components, trigger events, and assert on rendered output.",
            examples: [
              `import { mount } from '@vue/test-utils'\nconst wrapper = mount(Component)\nawait wrapper.find('button').trigger('click')`,
            ],
          },
        ],
      },
    ];

    return this.buildSignature("Vue.js", version, indicators, capabilities);
  }

  private hasFileContaining(context: DetectionContext, pattern: RegExp): boolean {
    return context.fileStructure.some((node) => pattern.test(node.path));
  }

  private hasCodePattern(context: DetectionContext, identifier: string): boolean {
    return context.codePatterns.some((pattern) => pattern.identifier === identifier);
  }

  private getVersion(context: DetectionContext, dependency: string): string | undefined {
    return this.getRuntimeDependencyVersion(context, dependency);
  }
}
