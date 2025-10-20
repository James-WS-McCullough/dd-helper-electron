import { d as defineComponent, a as useDisplayStore, p as onMounted, h as computed, i as createBlock, T as Transition, w as withCtx, o as openBlock, c as createElementBlock, e as createCommentVNode, b as createBaseVNode, f as unref, t as toDisplayString, F as Fragment, j as renderList, u as useDirectoryStore, m as createVNode, q as renderSlot, k as resolveComponent, n as normalizeClass } from "./index-D0_DqTAi.js";
const _hoisted_1$1 = {
  key: 0,
  class: "fixed bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur-lg border-t border-gray-700 shadow-2xl z-50"
};
const _hoisted_2$1 = { class: "flex items-center gap-4 p-3 overflow-x-auto" };
const _hoisted_3$1 = {
  key: 0,
  class: "flex-shrink-0 relative group"
};
const _hoisted_4$1 = { class: "relative w-32 h-20 bg-gray-900 rounded-lg overflow-hidden" };
const _hoisted_5$1 = ["src"];
const _hoisted_6$1 = ["src"];
const _hoisted_7$1 = { class: "absolute top-1 right-1" };
const _hoisted_8$1 = { class: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2" };
const _hoisted_9 = { class: "text-gray-300 text-xs truncate" };
const _hoisted_10 = { class: "relative w-32 h-20 bg-gray-900 rounded-lg overflow-hidden" };
const _hoisted_11 = ["src", "alt"];
const _hoisted_12 = { class: "absolute top-1 right-1" };
const _hoisted_13 = ["onClick"];
const _hoisted_14 = { class: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2" };
const _hoisted_15 = { class: "text-gray-300 text-xs truncate" };
const _hoisted_16 = {
  key: 1,
  class: "flex-shrink-0 ml-auto"
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "DisplayStatusBar",
  setup(__props) {
    const displayStore = useDisplayStore();
    onMounted(() => {
      displayStore.initialize();
    });
    const hasActiveDisplay = computed(() => {
      return displayStore.hasBackground || displayStore.hasPortraits;
    });
    return (_ctx, _cache) => {
      return openBlock(), createBlock(Transition, { name: "slide-up" }, {
        default: withCtx(() => [
          hasActiveDisplay.value ? (openBlock(), createElementBlock("div", _hoisted_1$1, [
            createBaseVNode("div", _hoisted_2$1, [
              unref(displayStore).hasBackground ? (openBlock(), createElementBlock("div", _hoisted_3$1, [
                createBaseVNode("div", _hoisted_4$1, [
                  unref(displayStore).displayState.background?.type === "image" ? (openBlock(), createElementBlock("img", {
                    key: 0,
                    src: `media://${unref(displayStore).displayState.background.path}`,
                    alt: "Background",
                    class: "w-full h-full object-cover"
                  }, null, 8, _hoisted_5$1)) : unref(displayStore).displayState.background?.type === "video" ? (openBlock(), createElementBlock("video", {
                    key: 1,
                    src: `media://${unref(displayStore).displayState.background.path}`,
                    class: "w-full h-full object-cover",
                    muted: ""
                  }, null, 8, _hoisted_6$1)) : createCommentVNode("", true),
                  createBaseVNode("div", _hoisted_7$1, [
                    createBaseVNode("button", {
                      onClick: _cache[0] || (_cache[0] = ($event) => unref(displayStore).clearBackground()),
                      class: "p-1 bg-red-600 hover:bg-red-700 rounded-full text-white text-xs transition-colors"
                    }, " ✕ ")
                  ]),
                  createBaseVNode("div", _hoisted_8$1, [
                    _cache[2] || (_cache[2] = createBaseVNode("p", { class: "text-white text-xs font-medium truncate" }, "Background", -1)),
                    createBaseVNode("p", _hoisted_9, toDisplayString(unref(displayStore).displayState.background?.displayName), 1)
                  ])
                ])
              ])) : createCommentVNode("", true),
              (openBlock(true), createElementBlock(Fragment, null, renderList(unref(displayStore).displayState.portraits, (portrait) => {
                return openBlock(), createElementBlock("div", {
                  key: portrait.path,
                  class: "flex-shrink-0 relative group"
                }, [
                  createBaseVNode("div", _hoisted_10, [
                    createBaseVNode("img", {
                      src: `media://${portrait.path}`,
                      alt: portrait.displayName,
                      class: "w-full h-full object-cover"
                    }, null, 8, _hoisted_11),
                    createBaseVNode("div", _hoisted_12, [
                      createBaseVNode("button", {
                        onClick: ($event) => unref(displayStore).clearPortrait(portrait.path),
                        class: "p-1 bg-red-600 hover:bg-red-700 rounded-full text-white text-xs transition-colors"
                      }, " ✕ ", 8, _hoisted_13)
                    ]),
                    createBaseVNode("div", _hoisted_14, [
                      _cache[3] || (_cache[3] = createBaseVNode("p", { class: "text-white text-xs font-medium truncate" }, "Portrait", -1)),
                      createBaseVNode("p", _hoisted_15, toDisplayString(portrait.displayName), 1)
                    ])
                  ])
                ]);
              }), 128)),
              hasActiveDisplay.value ? (openBlock(), createElementBlock("div", _hoisted_16, [
                createBaseVNode("button", {
                  onClick: _cache[1] || (_cache[1] = ($event) => unref(displayStore).clearAll()),
                  class: "px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                }, " Clear All Display ")
              ])) : createCommentVNode("", true)
            ])
          ])) : createCommentVNode("", true)
        ]),
        _: 1
      });
    };
  }
});
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const DisplayStatusBar = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-c38c9fd7"]]);
const _hoisted_1 = { class: "flex h-screen bg-gray-900" };
const _hoisted_2 = { class: "w-64 bg-gray-800 border-r border-gray-700 flex flex-col" };
const _hoisted_3 = { class: "p-4 border-b border-gray-700" };
const _hoisted_4 = { class: "text-xs text-gray-400 mt-1" };
const _hoisted_5 = { class: "flex-1 p-4 space-y-2 overflow-y-auto" };
const _hoisted_6 = { class: "text-xl" };
const _hoisted_7 = { class: "font-medium" };
const _hoisted_8 = { class: "flex-1 flex flex-col overflow-hidden" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "AppLayout",
  setup(__props) {
    const directoryStore = useDirectoryStore();
    const displayStore = useDisplayStore();
    const directoryName = computed(() => {
      if (directoryStore.currentDirectory) {
        const parts = directoryStore.currentDirectory.split("/");
        return parts[parts.length - 1];
      }
      return null;
    });
    const navItems = [
      { path: "/images", icon: "🖼️", label: "Images" },
      { path: "/audio", icon: "🎵", label: "Audio" },
      { path: "/party", icon: "👥", label: "Party" },
      { path: "/encounters", icon: "⚔️", label: "Encounters" },
      { path: "/initiative", icon: "🎯", label: "Initiative" },
      { path: "/battlemap", icon: "🗺️", label: "Battlemap" }
    ];
    async function openDisplayWindow() {
      await displayStore.openDisplayWindow();
    }
    return (_ctx, _cache) => {
      const _component_router_link = resolveComponent("router-link");
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("aside", _hoisted_2, [
          createBaseVNode("div", _hoisted_3, [
            _cache[0] || (_cache[0] = createBaseVNode("h1", { class: "text-xl font-bold text-white" }, "🎲 D&D Helper", -1)),
            createBaseVNode("p", _hoisted_4, toDisplayString(directoryName.value || "No directory selected"), 1)
          ]),
          createBaseVNode("nav", _hoisted_5, [
            (openBlock(), createElementBlock(Fragment, null, renderList(navItems, (item) => {
              return createVNode(_component_router_link, {
                key: item.path,
                to: item.path,
                class: normalizeClass(["flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors", { "bg-blue-600 text-white": _ctx.$route.path === item.path }])
              }, {
                default: withCtx(() => [
                  createBaseVNode("span", _hoisted_6, toDisplayString(item.icon), 1),
                  createBaseVNode("span", _hoisted_7, toDisplayString(item.label), 1)
                ]),
                _: 2
              }, 1032, ["to", "class"]);
            }), 64))
          ]),
          createBaseVNode("div", { class: "p-4 border-t border-gray-700" }, [
            createBaseVNode("button", {
              onClick: openDisplayWindow,
              class: "w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            }, [..._cache[1] || (_cache[1] = [
              createBaseVNode("span", { class: "text-xl" }, "📺", -1),
              createBaseVNode("span", null, "Display Window", -1)
            ])])
          ])
        ]),
        createBaseVNode("main", _hoisted_8, [
          renderSlot(_ctx.$slots, "default")
        ]),
        createVNode(DisplayStatusBar)
      ]);
    };
  }
});
export {
  _sfc_main as _
};
