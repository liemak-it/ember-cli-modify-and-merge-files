ModifyAndMergeFiles is an ember-cli addon to fetch multiple files from the app tree and merge them together with custom merge functions.

## Usage
To use ModifyAndMergeFiles you have to add `modifyFiles` to your EmberApp in the `ember-cli-build.js`.

```javascript
var app = new EmberApp({
  modifyFiles: [
    {...},
    {...}
  ]
});
```

The `array` must be filed with `objects`. Each of them will be used the generate one outputfile:
* `inputPath` The starting point to fetch the files from. This can be a `BroccoliTree` or a directory path (`string`). By default this is set to the ember app tree.
* `outputFile` The destination of the merged file including the filename.
* `modify` The function to merge/modify the fetches files. Must return a `string`.
* [Broccoli-Funnel properties](https://github.com/broccolijs/broccoli-funnel) Also accepts any broccoli-funnel property to fetch the needed files.

### Example

This example fetches all `*.yml` files from the `../config/locales`, converts them into `JSON` files and merges them together.

```javascript
var app = new EmberApp({
  modifyFiles: [
    {
      inputPath: '../config/locales/',
      include: ['*.yml'],
      outputFile: './locales/translations.js',
      modify: (files) => {
        var theOneObject = {};
        files.forEach((file) => {
          var obj = JsYaml.safeLoad(file);
          theOneObject = merge(theOneObject, obj);
        });

        return `export default ${JSON.stringify(theOneObject)};`;
      }
    },
    ...
  ]
});
```
