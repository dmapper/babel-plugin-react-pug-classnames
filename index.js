var DEFAULT_CLASSNAMES_FUNCTION = 'babel-plugin-react-pug-classnames/classnames'

function isTargetAttr (attribute, classAttribute) {
  if (!classAttribute) classAttribute = 'className'
  return attribute.name.name === classAttribute
}

function isGoodNameForNestedComponent (name) {
  return /^[A-Z0-9_$]/.test(name)
}

module.exports = (babel) => {
  var t = babel.types

  function generateRequireExpression (elementName, expression, classnamesFunction) {
    var require = t.callExpression(t.identifier('require'), [
      t.stringLiteral(classnamesFunction || DEFAULT_CLASSNAMES_FUNCTION)
    ])
    var callExpression = t.callExpression(
      require,
      [t.stringLiteral(elementName), expression]
    )
    return callExpression
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
                expr.right = generateRequireExpression(elementName, expr.right, opts.classnamesFunction)
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
              expr = generateRequireExpression(elementName, expr, opts.requireFunction)
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
    visitor: {
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
