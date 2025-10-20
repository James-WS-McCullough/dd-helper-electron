import { d as defineComponent, u as useDirectoryStore, a as useDisplayStore, r as ref, c as createElementBlock, b as createBaseVNode, e as createCommentVNode, f as unref, t as toDisplayString, g as useRouter, o as openBlock } from "./index-BJL_MLwK.js";
const _hoisted_1 = { class: "min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 flex items-center justify-center px-4" };
const _hoisted_2 = { class: "max-w-2xl w-full" };
const _hoisted_3 = { class: "bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 shadow-2xl" };
const _hoisted_4 = { class: "space-y-6" };
const _hoisted_5 = ["disabled"];
const _hoisted_6 = { key: 0 };
const _hoisted_7 = { key: 1 };
const _hoisted_8 = { key: 2 };
const _hoisted_9 = {
  key: 0,
  class: "bg-green-500/20 border border-green-500/50 rounded-lg p-4"
};
const _hoisted_10 = { class: "text-green-100 font-mono text-sm break-all" };
const _hoisted_11 = {
  key: 1,
  class: "bg-red-500/20 border border-red-500/50 rounded-lg p-4"
};
const _hoisted_12 = { class: "text-red-100 text-sm" };
const _hoisted_13 = {
  key: 2,
  class: "bg-blue-500/20 border border-blue-500/50 rounded-lg p-4"
};
const _hoisted_14 = { key: 3 };
const _hoisted_15 = ["disabled"];
const _hoisted_16 = { key: 0 };
const _hoisted_17 = { key: 1 };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "DirectorySelection",
  setup(__props) {
    const router = useRouter();
    const directoryStore = useDirectoryStore();
    const displayStore = useDisplayStore();
    const isLoading = ref(false);
    const isNavigating = ref(false);
    async function handleSelectDirectory() {
      isLoading.value = true;
      try {
        await directoryStore.selectDirectory();
      } finally {
        isLoading.value = false;
      }
    }
    async function handleContinueToDashboard() {
      isNavigating.value = true;
      try {
        await displayStore.openDisplayWindow();
        await router.push("/images");
      } catch (error) {
        console.error("Failed to navigate to dashboard:", error);
      } finally {
        isNavigating.value = false;
      }
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, [
          _cache[6] || (_cache[6] = createBaseVNode("div", { class: "text-center mb-8" }, [
            createBaseVNode("h1", { class: "text-6xl font-bold text-white mb-4" }, "🎲 D&D Helper"),
            createBaseVNode("p", { class: "text-xl text-purple-200" }, " Select your campaign directory to get started ")
          ], -1)),
          createBaseVNode("div", _hoisted_3, [
            createBaseVNode("div", _hoisted_4, [
              createBaseVNode("div", null, [
                createBaseVNode("button", {
                  onClick: handleSelectDirectory,
                  disabled: isLoading.value,
                  class: "w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors"
                }, [
                  _cache[0] || (_cache[0] = createBaseVNode("span", { class: "text-2xl" }, "📁", -1)),
                  isLoading.value ? (openBlock(), createElementBlock("span", _hoisted_6, "Loading...")) : unref(directoryStore).currentDirectory ? (openBlock(), createElementBlock("span", _hoisted_7, "Change Directory")) : (openBlock(), createElementBlock("span", _hoisted_8, "Select Campaign Directory"))
                ], 8, _hoisted_5)
              ]),
              unref(directoryStore).currentDirectory ? (openBlock(), createElementBlock("div", _hoisted_9, [
                _cache[1] || (_cache[1] = createBaseVNode("h3", { class: "text-sm font-semibold text-green-300 mb-2" }, "Selected Directory:", -1)),
                createBaseVNode("p", _hoisted_10, toDisplayString(unref(directoryStore).currentDirectory), 1)
              ])) : createCommentVNode("", true),
              unref(directoryStore).scanError ? (openBlock(), createElementBlock("div", _hoisted_11, [
                _cache[2] || (_cache[2] = createBaseVNode("h3", { class: "text-sm font-semibold text-red-300 mb-2" }, "Error:", -1)),
                createBaseVNode("p", _hoisted_12, toDisplayString(unref(directoryStore).scanError), 1)
              ])) : createCommentVNode("", true),
              unref(directoryStore).isScanning ? (openBlock(), createElementBlock("div", _hoisted_13, [..._cache[3] || (_cache[3] = [
                createBaseVNode("div", { class: "flex items-center gap-3" }, [
                  createBaseVNode("div", { class: "animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full" }),
                  createBaseVNode("span", { class: "text-blue-200" }, "Scanning directory for media files...")
                ], -1)
              ])])) : createCommentVNode("", true),
              unref(directoryStore).hasDirectory && !unref(directoryStore).isScanning ? (openBlock(), createElementBlock("div", _hoisted_14, [
                createBaseVNode("button", {
                  onClick: handleContinueToDashboard,
                  disabled: isNavigating.value,
                  class: "w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors"
                }, [
                  _cache[4] || (_cache[4] = createBaseVNode("span", { class: "text-2xl" }, "✓", -1)),
                  isNavigating.value ? (openBlock(), createElementBlock("span", _hoisted_16, "Opening Display...")) : (openBlock(), createElementBlock("span", _hoisted_17, "Continue to Dashboard"))
                ], 8, _hoisted_15)
              ])) : createCommentVNode("", true),
              _cache[5] || (_cache[5] = createBaseVNode("div", { class: "bg-purple-500/20 border border-purple-500/50 rounded-lg p-4 mt-6" }, [
                createBaseVNode("h3", { class: "text-sm font-semibold text-purple-300 mb-2" }, "📝 About D&D Helper"),
                createBaseVNode("p", { class: "text-purple-200 text-sm leading-relaxed" }, " This app helps you manage your D&D campaigns with media organization, party tracking, encounter management, and a tactical battlemap. Select a directory containing your campaign media to begin. ")
              ], -1))
            ])
          ])
        ])
      ]);
    };
  }
});
export {
  _sfc_main as default
};
