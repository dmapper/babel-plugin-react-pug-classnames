# babel-plugin-react-pug-classnames

Solves the problem of calling sub-components in `react-pug`
(improved version of https://github.com/ezhlobo/babel-plugin-transform-jsx-classname-components)

And also automatically parses the array or object value of `className` (`styleName`)
and transforms it through `classnames`-like function. Which adds BEM-type naming of modifiers by automatically prefixing all classnames with the Element name.

## Install

It must be installed into the actual dependencies, NOT the devDependencies.
The reason is that it does classnames processing through a dynamic runtime function which is `require()`'d from the package itself.

```bash
npm i babel-plugin-react-pug-classnames
```

Add plugin to your babel config right after the `transform-react-pug`:

```json
  ['transform-react-pug', {
    classAttribute: 'styleName'
  }],
  ['react-pug-classnames', {
    classAttribute: 'styleName'
  }]
```

## Options

`classAttribute` -- name of the attribute to use (for example `styleName`). Default: `className`

`classnamesFunction` -- classnames function to use to transform the className's object/array value. Default: `babel-plugin-react-pug-classnames/classnames`

## [BEM](http://getbem.com/naming/)

`-` is used as the separator between Element and Modifier. Examples:

`root`, `root-active`, `button-hover`, `button-disabled`, `button-primary`

This library is intended to be used with modular css ([`react-css-modules`](https://github.com/gajus/babel-plugin-react-css-modules) and [`react-native-css-modules`](https://github.com/kristerkari/react-native-css-modules)). So there is actually no concept of `Block`. Only `Elements` and `Modifiers`.

## Examples

*Let's say we have the following Pug template:*

```pug
Modal.Actions.controls.full(className=[color, {isOpened, isClosed}])
```

*What we intend that template to do is:*

1. to use `Modal.Actions` component

2. it is an `Element` (BEM) called `controls`, so it should have that class unmodified

3. it should also have an additional class `full`, also unmodified

4. and we want to autoprefix all `Modifiers` (BEM) in the `className` value with the name of the `Element` (BEM).

*The following is going to happen:*

1. If the first class starts from the Capital letter -- it's considered to be the property of the tag you are calling (in this case it's going to be `.Actions`).

2. The first non-capital class is considered to be the `Element` (BEM). All classes specified in the object/array value of `className` will be prefixed with the `Element` name (in this case it will be `controls-`)

3. All classes which you write through `.` (other than the first Capital class, if it exists) are not modified.

*The final effective output will be similar to:*

```js
<Modal.Actions
  className={
    'controls full ' + classnames([
      'controls-' + color,
      {
        'controls-isOpened': isOpened,
        'controls-isClosed': isClosed
      }
    ])
  }
/>
```

## License

MIT

(c) Decision Mapper - http://decisionmapper.com
