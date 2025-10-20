import { d as defineComponent, u as useDirectoryStore, a as useDisplayStore, h as computed, c as createElementBlock, b as createBaseVNode, t as toDisplayString, F as Fragment, k as renderList, p as renderSlot, o as openBlock, l as resolveComponent, j as createVNode, w as withCtx, n as normalizeClass } from "./index-BJL_MLwK.js";
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
        ])
      ]);
    };
  }
});
export {
  _sfc_main as _
};
