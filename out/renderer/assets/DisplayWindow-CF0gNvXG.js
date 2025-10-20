import { d as defineComponent, a as useDisplayStore, c as createElementBlock, e as createCommentVNode, f as unref, b as createBaseVNode, F as Fragment, k as renderList, o as openBlock, t as toDisplayString } from "./index-BJL_MLwK.js";
const _hoisted_1 = { class: "min-h-screen bg-black relative overflow-hidden" };
const _hoisted_2 = {
  key: 0,
  class: "absolute inset-0 z-0"
};
const _hoisted_3 = ["src"];
const _hoisted_4 = ["src"];
const _hoisted_5 = {
  key: 1,
  class: "absolute inset-0 z-10 bg-black flex items-center justify-center"
};
const _hoisted_6 = ["src"];
const _hoisted_7 = {
  key: 2,
  class: "absolute bottom-0 left-0 right-0 z-20 p-4"
};
const _hoisted_8 = { class: "flex justify-center gap-4" };
const _hoisted_9 = ["src", "alt"];
const _hoisted_10 = { class: "text-white text-center text-sm mt-2" };
const _hoisted_11 = ["src"];
const _hoisted_12 = ["src"];
const _hoisted_13 = ["src", "onEnded"];
const _hoisted_14 = {
  key: 4,
  class: "absolute inset-0 flex items-center justify-center z-0"
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "DisplayWindow",
  setup(__props) {
    const displayStore = useDisplayStore();
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        unref(displayStore).hasBackground ? (openBlock(), createElementBlock("div", _hoisted_2, [
          unref(displayStore).displayState.background?.type === "image" ? (openBlock(), createElementBlock("img", {
            key: 0,
            src: `media://${unref(displayStore).displayState.background.path}`,
            alt: "Background",
            class: "w-full h-full object-cover"
          }, null, 8, _hoisted_3)) : unref(displayStore).displayState.background?.type === "video" ? (openBlock(), createElementBlock("video", {
            key: 1,
            src: `media://${unref(displayStore).displayState.background.path}`,
            class: "w-full h-full object-cover",
            autoplay: "",
            muted: "",
            loop: ""
          }, null, 8, _hoisted_4)) : createCommentVNode("", true)
        ])) : createCommentVNode("", true),
        unref(displayStore).hasEvent ? (openBlock(), createElementBlock("div", _hoisted_5, [
          createBaseVNode("video", {
            src: `media://${unref(displayStore).displayState.event?.path}`,
            class: "max-w-full max-h-full",
            autoplay: "",
            onEnded: _cache[0] || (_cache[0] = ($event) => unref(displayStore).clearEvent())
          }, null, 40, _hoisted_6)
        ])) : createCommentVNode("", true),
        unref(displayStore).hasPortraits && !unref(displayStore).hasEvent ? (openBlock(), createElementBlock("div", _hoisted_7, [
          createBaseVNode("div", _hoisted_8, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(unref(displayStore).displayState.portraits, (portrait, index) => {
              return openBlock(), createElementBlock("div", {
                key: index,
                class: "bg-gray-900/80 rounded-lg p-2 backdrop-blur-sm"
              }, [
                createBaseVNode("img", {
                  src: `media://${portrait.path}`,
                  alt: portrait.displayName,
                  class: "h-48 w-auto object-contain rounded"
                }, null, 8, _hoisted_9),
                createBaseVNode("p", _hoisted_10, toDisplayString(portrait.displayName), 1)
              ]);
            }), 128))
          ])
        ])) : createCommentVNode("", true),
        unref(displayStore).hasBackgroundMusic ? (openBlock(), createElementBlock("audio", {
          key: 3,
          src: `media://${unref(displayStore).displayState.backgroundMusic?.path}`,
          autoplay: "",
          loop: ""
        }, null, 8, _hoisted_11)) : createCommentVNode("", true),
        (openBlock(true), createElementBlock(Fragment, null, renderList(unref(displayStore).displayState.backgroundSounds, (sound) => {
          return openBlock(), createElementBlock("audio", {
            key: sound.id,
            src: `media://${sound.path}`,
            autoplay: "",
            loop: ""
          }, null, 8, _hoisted_12);
        }), 128)),
        (openBlock(true), createElementBlock(Fragment, null, renderList(unref(displayStore).displayState.soundEffects, (effect) => {
          return openBlock(), createElementBlock("audio", {
            key: effect.id,
            src: `media://${effect.path}`,
            autoplay: "",
            onEnded: ($event) => unref(displayStore).clearSoundEffect(String(effect.id))
          }, null, 40, _hoisted_13);
        }), 128)),
        !unref(displayStore).hasBackground && !unref(displayStore).hasEvent && !unref(displayStore).hasPortraits ? (openBlock(), createElementBlock("div", _hoisted_14, [..._cache[1] || (_cache[1] = [
          createBaseVNode("div", { class: "text-center text-gray-600" }, [
            createBaseVNode("p", { class: "text-6xl mb-4" }, "🎲"),
            createBaseVNode("p", { class: "text-2xl font-semibold" }, "D&D Helper Display"),
            createBaseVNode("p", { class: "text-lg mt-2" }, "Waiting for content...")
          ], -1)
        ])])) : createCommentVNode("", true)
      ]);
    };
  }
});
export {
  _sfc_main as default
};
