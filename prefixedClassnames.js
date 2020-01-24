exports.c = function c () {
  var name = arguments[0]
  var modifiers = Array.prototype.slice.call(arguments, 1)
  modifiers = processModifiers(name, modifiers).concat(modifiers)
  return clsx.apply(undefined, modifiers)
}

function prefix (prefix, name) {
  return prefix + '-' + name
}

function processModifiers (name, modifiers) {
  return modifiers.map(modifier => {
    if (isArray(modifier)) return processModifiers(name, modifier)
    if (typeof modifier === 'string') return prefix(name, modifier)
    var res = {}
    for (var key in modifier) {
      res[prefix(name, key)] = modifier[key]
    }
    return res
  })
}

function isArray (value) {
  return Object.prototype.toString.call(value) === '[object Array]'
}

// clsx 1.0.3
// https://github.com/lukeed/clsx

function toVal (mix) {
  var k
  var y
  var str = ''
  if (mix) {
    if (typeof mix === 'object') {
      for (k in mix) {
        if (mix[k] && (y = toVal(!!mix.push ? mix[k] : k))) {
          str && (str += ' ')
          str += y
        }
      }
    } else if (typeof mix !== 'boolean') {
      str && (str += ' ')
      str += mix
    }
  }
  return str
}

function clsx () {
  var i = 0
  var x
  var str = ''
  while (i < arguments.length) {
    if (x = toVal(arguments[i++])) {
      str && (str += ' ')
      str += x
    }
  }
  return str
}
