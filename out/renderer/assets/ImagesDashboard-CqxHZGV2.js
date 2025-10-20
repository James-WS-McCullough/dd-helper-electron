import { _ as _sfc_main$1 } from "./AppLayout.vue_vue_type_script_setup_true_lang-BcQ77D-u.js";
import { d as defineComponent, u as useDirectoryStore, a as useDisplayStore, r as ref, h as computed, i as createBlock, o as openBlock, w as withCtx, b as createBaseVNode, t as toDisplayString, c as createElementBlock, f as unref, e as createCommentVNode, F as Fragment, j as renderList, n as normalizeClass } from "./index-D0_DqTAi.js";
import { f as filterVisualMedia } from "./mediaFilters-Cv4opu4j.js";
const _hoisted_1 = { class: "flex flex-col h-full" };
const _hoisted_2 = { class: "p-4 border-b border-gray-700 bg-gray-800" };
const _hoisted_3 = { class: "flex items-center justify-between" };
const _hoisted_4 = { class: "text-sm text-gray-400" };
const _hoisted_5 = { class: "text-sm text-gray-400" };
const _hoisted_6 = { class: "flex-1 overflow-y-auto p-6 bg-gray-900" };
const _hoisted_7 = {
  key: 0,
  class: "flex items-center justify-center h-full"
};
const _hoisted_8 = {
  key: 1,
  class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
};
const _hoisted_9 = ["onClick"];
const _hoisted_10 = { class: "text-center px-2" };
const _hoisted_11 = { class: "text-white text-sm font-medium mt-2 truncate" };
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
  key: 2,
  class: "flex items-center justify-center h-full"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "ImagesDashboard",
  setup(__props) {
    const directoryStore = useDirectoryStore();
    const displayStore = useDisplayStore();
    const currentFolderPath = ref("");
    const filteredMediaTree = computed(() => {
      if (!directoryStore.mediaTree) return null;
      return filterVisualMedia(directoryStore.mediaTree);
    });
    const currentFolderNode = computed(() => {
      if (!filteredMediaTree.value) return null;
      if (!currentFolderPath.value) return filteredMediaTree.value;
      const pathParts = currentFolderPath.value.split("/").filter((p) => p);
      let node = filteredMediaTree.value;
      for (const part of pathParts) {
        const child = node.children?.find((c) => c.displayName === part);
        if (!child || child.type !== "folder") return null;
        node = child;
      }
      return node;
    });
    const currentItems = computed(() => {
      const node = currentFolderNode.value;
      if (!node || !node.children) {
        return { folders: [], files: [] };
      }
      const folders = node.children.filter((c) => c.type === "folder");
      const files = node.children.filter((c) => c.type === "file");
      return { folders, files };
    });
    function navigateInto(folder) {
      if (folder.type !== "folder") return;
      if (currentFolderPath.value) {
        currentFolderPath.value = `${currentFolderPath.value}/${folder.displayName}`;
      } else {
        currentFolderPath.value = folder.displayName;
      }
    }
    function navigateUp() {
      const parts = currentFolderPath.value.split("/").filter((p) => p);
      parts.pop();
      currentFolderPath.value = parts.join("/");
    }
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
              _cache[0] || (_cache[0] = createBaseVNode("h2", { class: "text-lg font-semibold text-white" }, "Gallery", -1)),
              createBaseVNode("div", _hoisted_3, [
                createBaseVNode("p", _hoisted_4, toDisplayString(currentFolderPath.value || "Root"), 1),
                createBaseVNode("p", _hoisted_5, toDisplayString(currentItems.value.files.length) + " image" + toDisplayString(currentItems.value.files.length !== 1 ? "s" : "") + " · " + toDisplayString(currentItems.value.folders.length) + " folder" + toDisplayString(currentItems.value.folders.length !== 1 ? "s" : ""), 1)
              ])
            ]),
            createBaseVNode("div", _hoisted_6, [
              unref(directoryStore).isScanning ? (openBlock(), createElementBlock("div", _hoisted_7, [..._cache[1] || (_cache[1] = [
                createBaseVNode("div", { class: "text-center" }, [
                  createBaseVNode("div", { class: "animate-spin h-12 w-12 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4" }),
                  createBaseVNode("p", { class: "text-gray-400" }, "Scanning directory...")
                ], -1)
              ])])) : currentItems.value.folders.length > 0 || currentItems.value.files.length > 0 || currentFolderPath.value ? (openBlock(), createElementBlock("div", _hoisted_8, [
                currentFolderPath.value ? (openBlock(), createElementBlock("div", {
                  key: 0,
                  onClick: navigateUp,
                  class: "group relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all flex items-center justify-center"
                }, [..._cache[2] || (_cache[2] = [
                  createBaseVNode("div", { class: "text-center" }, [
                    createBaseVNode("span", { class: "text-6xl" }, "⬆️"),
                    createBaseVNode("p", { class: "text-white text-sm font-medium mt-2" }, "Back")
                  ], -1)
                ])])) : createCommentVNode("", true),
                (openBlock(true), createElementBlock(Fragment, null, renderList(currentItems.value.folders, (folder) => {
                  return openBlock(), createElementBlock("div", {
                    key: folder.path,
                    onClick: ($event) => navigateInto(folder),
                    class: "group relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-yellow-500 transition-all flex items-center justify-center"
                  }, [
                    createBaseVNode("div", _hoisted_10, [
                      _cache[3] || (_cache[3] = createBaseVNode("span", { class: "text-6xl" }, "📁", -1)),
                      createBaseVNode("p", _hoisted_11, toDisplayString(folder.displayName), 1)
                    ])
                  ], 8, _hoisted_9);
                }), 128)),
                (openBlock(true), createElementBlock(Fragment, null, renderList(currentItems.value.files, (media) => {
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
        ]),
        _: 1
      });
    };
  }
});
export {
  _sfc_main as default
};
