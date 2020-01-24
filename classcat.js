exports.c = function c (name, modifiers) {
  return cc(modifiers || '')
}

// classcat 4.0.2
// https://github.com/jorgebucaran/classcat

var isArray = Array.isArray || function(arg) {
  return Object.prototype.toString.call(arg) === '[object Array]';
}

function cc(names) {
  var i
  var len
  var tmp = typeof names
  var out = ""

  if (tmp === "string" || tmp === "number") return names || ""

  if (isArray(names) && names.length > 0) {
    for (i = 0, len = names.length; i < len; i++) {
      if ((tmp = cc(names[i])) !== "") out += (out && " ") + tmp
    }
  } else {
    for (i in names) {
      if (names.hasOwnProperty(i) && names[i]) out += (out && " ") + i
    }
  }

  return out
}
