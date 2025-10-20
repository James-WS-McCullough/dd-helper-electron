import { d as defineComponent, r as ref, l as resolveComponent, c as createElementBlock, o as openBlock, b as createBaseVNode, e as createCommentVNode, t as toDisplayString, n as normalizeClass, m as normalizeStyle, F as Fragment, k as renderList, i as createBlock } from "./index-BJL_MLwK.js";
const _hoisted_1 = {
  key: 0,
  class: "text-gray-400 text-sm w-4"
};
const _hoisted_2 = {
  key: 1,
  class: "w-4"
};
const _hoisted_3 = { class: "text-lg" };
const _hoisted_4 = { class: "text-sm text-gray-200 flex-1" };
const _hoisted_5 = { key: 0 };
const _sfc_main = /* @__PURE__ */ defineComponent({
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
          __props.node.type === "folder" ? (openBlock(), createElementBlock("span", _hoisted_1, toDisplayString(isExpanded.value ? "▼" : "▶"), 1)) : (openBlock(), createElementBlock("span", _hoisted_2)),
          createBaseVNode("span", _hoisted_3, toDisplayString(getIcon(__props.node)), 1),
          createBaseVNode("span", _hoisted_4, toDisplayString(__props.node.displayName || __props.node.name), 1),
          __props.node.type === "file" ? (openBlock(), createElementBlock("span", {
            key: 2,
            class: normalizeClass(["text-xs px-2 py-0.5 rounded", getBadgeClass(__props.node.mediaSubtype)])
          }, toDisplayString(__props.node.mediaSubtype), 3)) : createCommentVNode("", true)
        ], 4),
        isExpanded.value && __props.node.children && __props.node.children.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_5, [
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
function filterVisualMedia(node) {
  if (node.type === "file") {
    return node.mediaType === "image" || node.mediaType === "video" ? node : null;
  }
  const filteredChildren = node.children?.map((child) => filterVisualMedia(child)).filter((child) => child !== null);
  if (!filteredChildren || filteredChildren.length === 0) {
    return null;
  }
  return { ...node, children: filteredChildren };
}
function filterAudioMedia(node) {
  if (node.type === "file") {
    return node.mediaType === "audio" ? node : null;
  }
  const filteredChildren = node.children?.map((child) => filterAudioMedia(child)).filter((child) => child !== null);
  if (!filteredChildren || filteredChildren.length === 0) {
    return null;
  }
  return { ...node, children: filteredChildren };
}
function flattenMediaFiles(node) {
  if (node.type === "file") {
    return [node];
  }
  if (!node.children || node.children.length === 0) {
    return [];
  }
  return node.children.flatMap((child) => flattenMediaFiles(child));
}
function getAllVisualMedia(node) {
  if (!node) return [];
  const filtered = filterVisualMedia(node);
  return filtered ? flattenMediaFiles(filtered) : [];
}
function getAllAudioMedia(node) {
  if (!node) return [];
  const filtered = filterAudioMedia(node);
  return filtered ? flattenMediaFiles(filtered) : [];
}
export {
  _sfc_main as _,
  filterAudioMedia as a,
  getAllAudioMedia as b,
  filterVisualMedia as f,
  getAllVisualMedia as g
};
