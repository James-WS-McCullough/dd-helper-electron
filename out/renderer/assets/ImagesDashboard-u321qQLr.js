import { _ as _sfc_main$1 } from "./AppLayout.vue_vue_type_script_setup_true_lang-DD_oOrCT.js";
import { f as filterVisualMedia, g as getAllVisualMedia, _ as _sfc_main$2 } from "./mediaFilters-CG1o4w4k.js";
import { d as defineComponent, u as useDirectoryStore, a as useDisplayStore, h as computed, i as createBlock, o as openBlock, w as withCtx, b as createBaseVNode, c as createElementBlock, f as unref, j as createVNode, t as toDisplayString, F as Fragment, k as renderList, e as createCommentVNode, n as normalizeClass } from "./index-BJL_MLwK.js";
const _hoisted_1 = { class: "flex h-full" };
const _hoisted_2 = { class: "w-80 border-r border-gray-700 bg-gray-800 flex flex-col" };
const _hoisted_3 = { class: "flex-1 overflow-y-auto p-4" };
const _hoisted_4 = {
  key: 0,
  class: "flex items-center justify-center h-32"
};
const _hoisted_5 = {
  key: 1,
  class: "space-y-1"
};
const _hoisted_6 = {
  key: 2,
  class: "text-center py-8 text-gray-400"
};
const _hoisted_7 = { class: "flex-1 flex flex-col overflow-hidden" };
const _hoisted_8 = { class: "p-4 border-b border-gray-700 bg-gray-800" };
const _hoisted_9 = { class: "text-sm text-gray-400" };
const _hoisted_10 = { class: "flex-1 overflow-y-auto p-6 bg-gray-900" };
const _hoisted_11 = {
  key: 0,
  class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
};
const _hoisted_12 = ["onClick"];
const _hoisted_13 = ["src", "alt"];
const _hoisted_14 = ["src"];
const _hoisted_15 = { class: "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" };
const _hoisted_16 = { class: "absolute bottom-0 left-0 right-0 p-3" };
const _hoisted_17 = { class: "text-white text-sm font-medium truncate" };
const _hoisted_18 = { class: "flex items-center gap-2 mt-1" };
const _hoisted_19 = { class: "text-xs text-gray-300" };
const _hoisted_20 = {
  key: 2,
  class: "absolute inset-0 flex items-center justify-center pointer-events-none"
};
const _hoisted_21 = {
  key: 1,
  class: "flex items-center justify-center h-full"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ImagesDashboard",
  setup(__props) {
    const directoryStore = useDirectoryStore();
    const displayStore = useDisplayStore();
    const filteredMediaTree = computed(() => {
      if (!directoryStore.mediaTree) return null;
      return filterVisualMedia(directoryStore.mediaTree);
    });
    const allVisualMedia = computed(() => {
      return getAllVisualMedia(directoryStore.mediaTree);
    });
    async function handleMediaSelect(media) {
      if (media.type === "file") {
        await displayStore.displayMedia(
          media.path,
          media.mediaType,
          media.mediaSubtype,
          media.displayName
        );
      }
    }
    function getBadgeClass(subtype) {
      const classes = {
        portrait: "bg-blue-500/30 text-blue-200",
        background: "bg-green-500/30 text-green-200",
        event: "bg-purple-500/30 text-purple-200",
        loop: "bg-yellow-500/30 text-yellow-200",
        music: "bg-pink-500/30 text-pink-200",
        sound: "bg-orange-500/30 text-orange-200",
        default: "bg-gray-500/30 text-gray-200"
      };
      return classes[subtype] || classes.default;
    }
    return (_ctx, _cache) => {
      return openBlock(), createBlock(_sfc_main$1, null, {
        default: withCtx(() => [
          createBaseVNode("div", _hoisted_1, [
            createBaseVNode("div", _hoisted_2, [
              _cache[2] || (_cache[2] = createBaseVNode("div", { class: "p-4 border-b border-gray-700" }, [
                createBaseVNode("h2", { class: "text-lg font-semibold text-white" }, "Images & Videos"),
                createBaseVNode("p", { class: "text-sm text-gray-400" }, "Browse by folder")
              ], -1)),
              createBaseVNode("div", _hoisted_3, [
                unref(directoryStore).isScanning ? (openBlock(), createElementBlock("div", _hoisted_4, [..._cache[0] || (_cache[0] = [
                  createBaseVNode("div", { class: "text-center" }, [
                    createBaseVNode("div", { class: "animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2" }),
                    createBaseVNode("p", { class: "text-gray-400" }, "Scanning directory...")
                  ], -1)
                ])])) : filteredMediaTree.value ? (openBlock(), createElementBlock("div", _hoisted_5, [
                  createVNode(_sfc_main$2, {
                    node: filteredMediaTree.value,
                    depth: 0,
                    onSelectMedia: handleMediaSelect
                  }, null, 8, ["node"])
                ])) : (openBlock(), createElementBlock("div", _hoisted_6, [..._cache[1] || (_cache[1] = [
                  createBaseVNode("p", null, "No images or videos found", -1)
                ])]))
              ])
            ]),
            createBaseVNode("div", _hoisted_7, [
              createBaseVNode("div", _hoisted_8, [
                _cache[3] || (_cache[3] = createBaseVNode("h2", { class: "text-lg font-semibold text-white" }, "Gallery", -1)),
                createBaseVNode("p", _hoisted_9, toDisplayString(allVisualMedia.value.length) + " image" + toDisplayString(allVisualMedia.value.length !== 1 ? "s" : "") + " and video" + toDisplayString(allVisualMedia.value.length !== 1 ? "s" : ""), 1)
              ]),
              createBaseVNode("div", _hoisted_10, [
                allVisualMedia.value.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_11, [
                  (openBlock(true), createElementBlock(Fragment, null, renderList(allVisualMedia.value, (media) => {
                    return openBlock(), createElementBlock("div", {
                      key: media.path,
                      onClick: ($event) => handleMediaSelect(media),
                      class: "group relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                    }, [
                      media.mediaType === "image" ? (openBlock(), createElementBlock("img", {
                        key: 0,
                        src: `media://${media.path}`,
                        alt: media.displayName,
                        class: "w-full h-full object-cover",
                        loading: "lazy"
                      }, null, 8, _hoisted_13)) : media.mediaType === "video" ? (openBlock(), createElementBlock("video", {
                        key: 1,
                        src: `media://${media.path}`,
                        class: "w-full h-full object-cover",
                        muted: ""
                      }, null, 8, _hoisted_14)) : createCommentVNode("", true),
                      createBaseVNode("div", _hoisted_15, [
                        createBaseVNode("div", _hoisted_16, [
                          createBaseVNode("p", _hoisted_17, toDisplayString(media.displayName), 1),
                          createBaseVNode("div", _hoisted_18, [
                            createBaseVNode("span", {
                              class: normalizeClass(["text-xs px-2 py-0.5 rounded", getBadgeClass(media.mediaSubtype)])
                            }, toDisplayString(media.mediaSubtype), 3),
                            createBaseVNode("span", _hoisted_19, toDisplayString(media.mediaType === "video" ? "🎬" : "🖼️"), 1)
                          ])
                        ])
                      ]),
                      media.mediaType === "video" ? (openBlock(), createElementBlock("div", _hoisted_20, [..._cache[4] || (_cache[4] = [
                        createBaseVNode("div", { class: "bg-black/50 rounded-full p-4" }, [
                          createBaseVNode("span", { class: "text-4xl" }, "▶️")
                        ], -1)
                      ])])) : createCommentVNode("", true)
                    ], 8, _hoisted_12);
                  }), 128))
                ])) : (openBlock(), createElementBlock("div", _hoisted_21, [..._cache[5] || (_cache[5] = [
                  createBaseVNode("div", { class: "text-center text-gray-500" }, [
                    createBaseVNode("p", { class: "text-xl mb-2" }, "📷"),
                    createBaseVNode("p", null, "No images or videos found in the selected directory")
                  ], -1)
                ])]))
              ])
            ])
          ])
        ]),
        _: 1
      });
    };
  }
});
export {
  _sfc_main as default
};
