import { _ as _sfc_main$2 } from "./AppLayout.vue_vue_type_script_setup_true_lang-BcQ77D-u.js";
import { d as defineComponent, r as ref, k as resolveComponent, c as createElementBlock, o as openBlock, b as createBaseVNode, e as createCommentVNode, t as toDisplayString, n as normalizeClass, l as normalizeStyle, F as Fragment, j as renderList, i as createBlock, u as useDirectoryStore, a as useDisplayStore, h as computed, w as withCtx, f as unref, m as createVNode } from "./index-D0_DqTAi.js";
import { a as filterAudioMedia, g as getAllAudioMedia } from "./mediaFilters-Cv4opu4j.js";
const _hoisted_1$1 = {
  key: 0,
  class: "text-gray-400 text-sm w-4"
};
const _hoisted_2$1 = {
  key: 1,
  class: "w-4"
};
const _hoisted_3$1 = { class: "text-lg" };
const _hoisted_4$1 = { class: "text-sm text-gray-200 flex-1" };
const _hoisted_5$1 = { key: 0 };
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "MediaTreeNode",
  props: {
    node: {},
    depth: {}
  },
  emits: ["select-media"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const isExpanded = ref(props.depth === 0);
    function handleClick() {
      if (props.node.type === "folder") {
        isExpanded.value = !isExpanded.value;
      } else {
        emit("select-media", props.node);
      }
    }
    function getIcon(node) {
      if (node.type === "folder") return "📁";
      switch (node.mediaType) {
        case "image":
          return "🖼️";
        case "video":
          return "🎬";
        case "audio":
          return "🎵";
        default:
          return "📄";
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
      const _component_MediaTreeNode = resolveComponent("MediaTreeNode", true);
      return openBlock(), createElementBlock("div", null, [
        createBaseVNode("div", {
          onClick: handleClick,
          class: "flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 cursor-pointer transition-colors",
          style: normalizeStyle({ paddingLeft: `${__props.depth * 1 + 0.75}rem` })
        }, [
          __props.node.type === "folder" ? (openBlock(), createElementBlock("span", _hoisted_1$1, toDisplayString(isExpanded.value ? "▼" : "▶"), 1)) : (openBlock(), createElementBlock("span", _hoisted_2$1)),
          createBaseVNode("span", _hoisted_3$1, toDisplayString(getIcon(__props.node)), 1),
          createBaseVNode("span", _hoisted_4$1, toDisplayString(__props.node.displayName || __props.node.name), 1),
          __props.node.type === "file" ? (openBlock(), createElementBlock("span", {
            key: 2,
            class: normalizeClass(["text-xs px-2 py-0.5 rounded", getBadgeClass(__props.node.mediaSubtype)])
          }, toDisplayString(__props.node.mediaSubtype), 3)) : createCommentVNode("", true)
        ], 4),
        isExpanded.value && __props.node.children && __props.node.children.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_5$1, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(__props.node.children, (child) => {
            return openBlock(), createBlock(_component_MediaTreeNode, {
              key: child.path,
              node: child,
              depth: __props.depth + 1,
              onSelectMedia: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("select-media", $event))
            }, null, 8, ["node", "depth"]);
          }), 128))
        ])) : createCommentVNode("", true)
      ]);
    };
  }
});
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
const _hoisted_9 = { class: "flex items-center justify-between mb-4" };
const _hoisted_10 = { class: "text-sm text-gray-400" };
const _hoisted_11 = {
  key: 0,
  class: "space-y-2"
};
const _hoisted_12 = {
  key: 0,
  class: "bg-pink-500/20 border border-pink-500/50 rounded-lg p-3"
};
const _hoisted_13 = { class: "flex items-center justify-between" };
const _hoisted_14 = { class: "flex items-center gap-3" };
const _hoisted_15 = { class: "text-xs text-pink-300" };
const _hoisted_16 = {
  key: 1,
  class: "bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3"
};
const _hoisted_17 = { class: "flex items-center justify-between mb-2" };
const _hoisted_18 = { class: "flex items-center gap-2" };
const _hoisted_19 = { class: "text-sm font-medium text-yellow-200" };
const _hoisted_20 = { class: "space-y-1" };
const _hoisted_21 = { class: "text-xs text-yellow-100" };
const _hoisted_22 = ["onClick"];
const _hoisted_23 = {
  key: 2,
  class: "bg-orange-500/20 border border-orange-500/50 rounded-lg p-3"
};
const _hoisted_24 = { class: "flex items-center gap-2" };
const _hoisted_25 = { class: "text-sm font-medium text-orange-200" };
const _hoisted_26 = { class: "flex-1 overflow-y-auto p-4 bg-gray-900" };
const _hoisted_27 = {
  key: 0,
  class: "space-y-2"
};
const _hoisted_28 = ["onClick"];
const _hoisted_29 = { class: "flex-1 min-w-0" };
const _hoisted_30 = { class: "text-white font-medium truncate" };
const _hoisted_31 = { class: "flex items-center gap-2 mt-1" };
const _hoisted_32 = { class: "text-xs text-gray-400 truncate" };
const _hoisted_33 = {
  key: 1,
  class: "flex items-center justify-center h-full"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "AudioDashboard",
  setup(__props) {
    const directoryStore = useDirectoryStore();
    const displayStore = useDisplayStore();
    const filteredMediaTree = computed(() => {
      if (!directoryStore.mediaTree) return null;
      return filterAudioMedia(directoryStore.mediaTree);
    });
    const allAudioMedia = computed(() => {
      return getAllAudioMedia(directoryStore.mediaTree);
    });
    const hasActiveAudio = computed(() => {
      return displayStore.hasBackgroundMusic || displayStore.backgroundSoundCount > 0 || displayStore.soundEffectCount > 0;
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
    async function clearAllAudio() {
      await Promise.all([
        displayStore.clearBackgroundMusic(),
        displayStore.clearAllBackgroundSounds(),
        displayStore.clearAllSoundEffects()
      ]);
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
    function getFileName(path) {
      return path.split("/").pop() || path;
    }
    return (_ctx, _cache) => {
      return openBlock(), createBlock(_sfc_main$2, null, {
        default: withCtx(() => [
          createBaseVNode("div", _hoisted_1, [
            createBaseVNode("div", _hoisted_2, [
              _cache[4] || (_cache[4] = createBaseVNode("div", { class: "p-4 border-b border-gray-700" }, [
                createBaseVNode("h2", { class: "text-lg font-semibold text-white" }, "Audio Files"),
                createBaseVNode("p", { class: "text-sm text-gray-400" }, "Browse by folder")
              ], -1)),
              createBaseVNode("div", _hoisted_3, [
                unref(directoryStore).isScanning ? (openBlock(), createElementBlock("div", _hoisted_4, [..._cache[2] || (_cache[2] = [
                  createBaseVNode("div", { class: "text-center" }, [
                    createBaseVNode("div", { class: "animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2" }),
                    createBaseVNode("p", { class: "text-gray-400" }, "Scanning directory...")
                  ], -1)
                ])])) : filteredMediaTree.value ? (openBlock(), createElementBlock("div", _hoisted_5, [
                  createVNode(_sfc_main$1, {
                    node: filteredMediaTree.value,
                    depth: 0,
                    onSelectMedia: handleMediaSelect
                  }, null, 8, ["node"])
                ])) : (openBlock(), createElementBlock("div", _hoisted_6, [..._cache[3] || (_cache[3] = [
                  createBaseVNode("p", null, "No audio files found", -1)
                ])]))
              ])
            ]),
            createBaseVNode("div", _hoisted_7, [
              createBaseVNode("div", _hoisted_8, [
                createBaseVNode("div", _hoisted_9, [
                  createBaseVNode("div", null, [
                    _cache[5] || (_cache[5] = createBaseVNode("h2", { class: "text-lg font-semibold text-white" }, "Audio Library", -1)),
                    createBaseVNode("p", _hoisted_10, toDisplayString(allAudioMedia.value.length) + " audio file" + toDisplayString(allAudioMedia.value.length !== 1 ? "s" : ""), 1)
                  ]),
                  hasActiveAudio.value ? (openBlock(), createElementBlock("button", {
                    key: 0,
                    onClick: clearAllAudio,
                    class: "px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                  }, " Clear All Audio ")) : createCommentVNode("", true)
                ]),
                hasActiveAudio.value ? (openBlock(), createElementBlock("div", _hoisted_11, [
                  unref(displayStore).hasBackgroundMusic ? (openBlock(), createElementBlock("div", _hoisted_12, [
                    createBaseVNode("div", _hoisted_13, [
                      createBaseVNode("div", _hoisted_14, [
                        _cache[7] || (_cache[7] = createBaseVNode("span", { class: "text-2xl" }, "🎵", -1)),
                        createBaseVNode("div", null, [
                          _cache[6] || (_cache[6] = createBaseVNode("p", { class: "text-sm font-medium text-pink-200" }, "Background Music", -1)),
                          createBaseVNode("p", _hoisted_15, toDisplayString(unref(displayStore).displayState.backgroundMusic?.displayName), 1)
                        ])
                      ]),
                      createBaseVNode("button", {
                        onClick: _cache[0] || (_cache[0] = ($event) => unref(displayStore).clearBackgroundMusic()),
                        class: "px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
                      }, " Stop ")
                    ])
                  ])) : createCommentVNode("", true),
                  unref(displayStore).backgroundSoundCount > 0 ? (openBlock(), createElementBlock("div", _hoisted_16, [
                    createBaseVNode("div", _hoisted_17, [
                      createBaseVNode("div", _hoisted_18, [
                        _cache[8] || (_cache[8] = createBaseVNode("span", { class: "text-xl" }, "🔊", -1)),
                        createBaseVNode("p", _hoisted_19, "Background Sounds (" + toDisplayString(unref(displayStore).backgroundSoundCount) + ")", 1)
                      ]),
                      createBaseVNode("button", {
                        onClick: _cache[1] || (_cache[1] = ($event) => unref(displayStore).clearAllBackgroundSounds()),
                        class: "px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
                      }, " Clear All ")
                    ]),
                    createBaseVNode("div", _hoisted_20, [
                      (openBlock(true), createElementBlock(Fragment, null, renderList(unref(displayStore).displayState.backgroundSounds, (sound) => {
                        return openBlock(), createElementBlock("div", {
                          key: sound.id,
                          class: "flex items-center justify-between bg-gray-800/50 rounded px-2 py-1"
                        }, [
                          createBaseVNode("p", _hoisted_21, toDisplayString(sound.displayName), 1),
                          createBaseVNode("button", {
                            onClick: ($event) => unref(displayStore).clearBackgroundSound(String(sound.id)),
                            class: "text-xs text-red-400 hover:text-red-300"
                          }, " ✕ ", 8, _hoisted_22)
                        ]);
                      }), 128))
                    ])
                  ])) : createCommentVNode("", true),
                  unref(displayStore).soundEffectCount > 0 ? (openBlock(), createElementBlock("div", _hoisted_23, [
                    createBaseVNode("div", _hoisted_24, [
                      _cache[9] || (_cache[9] = createBaseVNode("span", { class: "text-xl" }, "💥", -1)),
                      createBaseVNode("p", _hoisted_25, " Active Sound Effects (" + toDisplayString(unref(displayStore).soundEffectCount) + ") ", 1)
                    ]),
                    _cache[10] || (_cache[10] = createBaseVNode("p", { class: "text-xs text-orange-300 mt-1" }, "Sound effects play once and auto-remove", -1))
                  ])) : createCommentVNode("", true)
                ])) : createCommentVNode("", true)
              ]),
              createBaseVNode("div", _hoisted_26, [
                allAudioMedia.value.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_27, [
                  (openBlock(true), createElementBlock(Fragment, null, renderList(allAudioMedia.value, (audio) => {
                    return openBlock(), createElementBlock("div", {
                      key: audio.path,
                      onClick: ($event) => handleMediaSelect(audio),
                      class: "group flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-750 rounded-lg cursor-pointer transition-colors border border-gray-700 hover:border-blue-500"
                    }, [
                      _cache[11] || (_cache[11] = createBaseVNode("div", { class: "flex-shrink-0 w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-2xl" }, " 🎵 ", -1)),
                      createBaseVNode("div", _hoisted_29, [
                        createBaseVNode("p", _hoisted_30, toDisplayString(audio.displayName), 1),
                        createBaseVNode("div", _hoisted_31, [
                          createBaseVNode("span", {
                            class: normalizeClass(["text-xs px-2 py-0.5 rounded", getBadgeClass(audio.mediaSubtype)])
                          }, toDisplayString(audio.mediaSubtype), 3),
                          createBaseVNode("span", _hoisted_32, toDisplayString(getFileName(audio.path)), 1)
                        ])
                      ]),
                      _cache[12] || (_cache[12] = createBaseVNode("div", { class: "flex-shrink-0" }, [
                        createBaseVNode("div", { class: "w-10 h-10 bg-blue-600 group-hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors" }, [
                          createBaseVNode("span", { class: "text-white text-xl" }, "▶")
                        ])
                      ], -1))
                    ], 8, _hoisted_28);
                  }), 128))
                ])) : (openBlock(), createElementBlock("div", _hoisted_33, [..._cache[13] || (_cache[13] = [
                  createBaseVNode("div", { class: "text-center text-gray-500" }, [
                    createBaseVNode("p", { class: "text-xl mb-2" }, "🎵"),
                    createBaseVNode("p", null, "No audio files found in the selected directory")
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
