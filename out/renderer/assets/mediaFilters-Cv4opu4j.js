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
function getAllAudioMedia(node) {
  if (!node) return [];
  const filtered = filterAudioMedia(node);
  return filtered ? flattenMediaFiles(filtered) : [];
}
export {
  filterAudioMedia as a,
  filterVisualMedia as f,
  getAllAudioMedia as g
};
