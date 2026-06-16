// ID generator — produces short, sortable, collision-resistant IDs.

function genId(prefix) {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

module.exports = { genId };
