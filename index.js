/*jshint node:true*/
'use strict';

var Plugin = require('broccoli-plugin');
var Path = require('path');
var FS = require('fs');
var Funnel = require('broccoli-funnel');
var mkdirp = require('mkdirp');
var mergeTrees = require('broccoli-merge-trees');
var recursiveReadSync = require('recursive-readdir-sync');

// Create a subclass ModifyAndMergeFiles derived from Plugin
ModifyAndMergeFiles.prototype = Object.create(Plugin.prototype);
ModifyAndMergeFiles.prototype.constructor = ModifyAndMergeFiles;

/**
 * @class ModifyAndMergeFiles
 * @constructor
 * @extends Plugin
 */
function ModifyAndMergeFiles(inputNode, options) {
  // Create new instance of `ModifyAndMergeFiles` if this is called without a `new`.
  if (!(this instanceof ModifyAndMergeFiles)) { return new ModifyAndMergeFiles(inputNode, options); }

  // Throw an error if `modify` or `outputFile` is not set.
  if (!options || !options.modify) { throw new Error('No `modify` function given'); }
  if (!options || !options.outputFile) { throw new Error('No `outputFile` given'); }

  // Filter the files and watch them with `broccoli-funnel`.
  inputNode = Funnel(inputNode, options);

  // Call the constructor of the extended class.
  Plugin.call(this, [inputNode], options);

  this.options = options;
}

/**
 * Call the given `modify` function on each file which could be found with `Funnel`.
 *
 * This is called everytime one of the watched files is changed.
 *
 * @method build
 */
ModifyAndMergeFiles.prototype.build = function() {
  var inputPath = this.inputPaths[0];
  var fullOutputPath = Path.join(this.outputPath, this.options.outputFile);
  var targetDir = Path.dirname(fullOutputPath);

  // Get a list of all filtered files.
  var fileList = recursiveReadSync(inputPath);
  var files = fileList.map(function(fileName) {
    var extension = Path.extname(fileName);

    return {
      data: FS.readFileSync(fileName),
      extension: extension,
      name: Path.basename(fileName, extension)
    };
  });

  // Convert files.
  var outputFile = this.options.modify(files);

  // Create the folder structure of it does not exist.
  if (!FS.existsSync(targetDir)) {
    mkdirp.sync(targetDir);
  }

  // Write the returned data into the `outputFile`.
  FS.writeFileSync(fullOutputPath, outputFile);
};

module.exports = {
  name: 'modify-and-merge-files',

  /**
   * Returns a broccoli tree which will be added to the ember app build tree.
   *
   * @method treeForApp
   * @return {BroccoliTree}
   */
  treeForApp: function() {
    // Get the options from the ember app.
    var modifyFiles = (this.app && this.app.options && this.app.options.modifyFiles) || [];

    var trees = modifyFiles.map(fileOptions => {
      return ModifyAndMergeFiles(fileOptions.inputPath || this.app.trees.app, fileOptions);
    });

    return mergeTrees(trees);
  }
};
