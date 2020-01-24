var DEFAULT_CLASSNAMES_FUNCTION = 'babel-plugin-react-pug-classnames/classcat'
var LEGACY_CLASSNAMES_FUNCTION = 'babel-plugin-react-pug-classnames/prefixedClassnames'

// DEPRECATED.
// Legacy classnames prefixing is enabled by default for now.
// In later versions it will be turned off by default and then removed completely.
// If you need to provide some kind of BEM-like prefixing or another type
// of classnames functionality -- specify the classnamesFunction in options
// which must be a module name with the following code:
// exports.c = function (name, modifiers) { ... }
var DEFAULT_SUPPORT_LEGACY = true

function isTargetAttr (attribute, classAttribute) {
  if (!classAttribute) classAttribute = 'className'
  return attribute.name.name === classAttribute
}

function isGoodNameForNestedComponent (name) {
  return /^[A-Z0-9_$]/.test(name)
}

module.exports = (babel) => {
  var reqName
  var hasTransformedClassName
  var t = babel.types

  function isRequire(node) {
    return (
      node &&
      node.declarations &&
      node.declarations[0] &&
      node.declarations[0].init &&
      node.declarations[0].init.callee &&
      node.declarations[0].init.callee.name === "require"
    );
  }

  function generateRequireExpression (elementName, expression, opts) {
    var callExpression = t.callExpression(
      reqName,
      [t.stringLiteral(elementName), expression]
    )
    return callExpression
  }

  function generateRequire(name, opts) {
    var legacy = opts.legacy == null ? DEFAULT_SUPPORT_LEGACY : opts.legacy
    var classnamesFn = opts.classnamesFunction || (
      legacy ? LEGACY_CLASSNAMES_FUNCTION : DEFAULT_CLASSNAMES_FUNCTION
    )
    var require = t.callExpression(t.identifier('require'), [
      t.stringLiteral(classnamesFn)
    ])
    var cFn = t.memberExpression(require, t.identifier('c'));
    var d = t.variableDeclarator(name, cFn);
    return t.variableDeclaration("var", [d]);
  }

  function processClass (JSXOpeningElement, opts) {
    var name = JSXOpeningElement.node.name.name
    var property = null

    JSXOpeningElement.traverse({
      JSXAttribute (JSXAttribute) {
        var expr
        var classesValue
        var classes
        var elementName

        if (!isTargetAttr(JSXAttribute.node, opts.classAttribute)) return

        if (t.isStringLiteral(JSXAttribute.node.value)) {
          var classNameValue = JSXAttribute.node.value.value.split(' ')

          if (isGoodNameForNestedComponent(classNameValue[0])) {
            property = classNameValue[0]
            if (classNameValue.length > 1) {
              JSXAttribute.get('value').replaceWith(t.stringLiteral(classNameValue.slice(1).join(' ')))
            } else {
              JSXAttribute.remove()
            }
          }
        } else if (t.isJSXExpressionContainer(JSXAttribute.node.value)) {
          if (t.isBinaryExpression(JSXAttribute.node.value.expression)) {
            expr = JSXAttribute.node.value.expression
            if (expr.operator !== '+') return
            if (!t.isStringLiteral(expr.left)) return

            classesValue = expr.left.value.trim()
            classes = classesValue.split(' ')

            // Process tag property
            if (isGoodNameForNestedComponent(classes[0])) {
              property = classes[0]
              // Get rid of the class which is actually a tag property
              classes = classes.slice(1)
              expr.left.value = classes.join(' ') + ' '
            }

            // Process element name (BEM)
            if (classes[0]) {
              elementName = classes[0]
              // Process only if the styleName value is an object or array
              if (t.isObjectExpression(expr.right) || t.isArrayExpression(expr.right)) {
                hasTransformedClassName = true
                expr.right = generateRequireExpression(elementName, expr.right, opts)
              }
            }
          } else if (t.isArrayExpression(JSXAttribute.node.value.expression)) {
            expr = JSXAttribute.node.value.expression
            classesValue = expr.elements[0].value
            classes = classesValue.split(' ')

            // Process tag property
            if (isGoodNameForNestedComponent(classes[0])) {
              property = classes[0]
              // Get rid of the class which is actually a tag property
              classes = classes.slice(1)
            }

            expr.elements = expr.elements.slice(1)

            // Process element name (BEM)
            if (classes[0]) {
              elementName = classes[0]
              // Process only if the styleName value is an object or array
              hasTransformedClassName = true
              expr = generateRequireExpression(elementName, expr, opts)
            }

            var plus = t.binaryExpression('+', t.stringLiteral(classes.join(' ') + ' '), expr)
            JSXAttribute.node.value.expression = plus
          }
        }
      }
    })

    if (property) {
      var tag = t.jSXMemberExpression(t.jSXIdentifier(name), t.jSXIdentifier(property))

      JSXOpeningElement.get('name').replaceWith(tag)

      if (!JSXOpeningElement.node.selfClosing) {
        JSXOpeningElement.getSibling('closingElement').get('name').replaceWith(tag)
      }
    }
  }

  return {
    post() {
      reqName = null;
      hasTransformedClassName = null;
    },
    visitor: {
      Program: {
        enter(path, state) {
          reqName = path.scope.generateUidIdentifier(
            "classnames"
          );
        },
        exit(path, state) {
          if (!hasTransformedClassName) {
            return;
          }

          const lastImportOrRequire = path
            .get("body")
            .filter(p => p.isImportDeclaration() || isRequire(p.node))
            .pop();

          if (lastImportOrRequire) {
            lastImportOrRequire.insertAfter(generateRequire(reqName, state.opts));
          }
        }
      },
      JSXElement (JSXElement, params) {
        JSXElement.traverse({
          JSXOpeningElement (JSXOpeningElement) {
            processClass(JSXOpeningElement, params.opts)
          }
        })
      }
    }
  }
}
