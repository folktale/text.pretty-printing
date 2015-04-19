var specify  = require('specify-core')
var reporter = require('specify-reporter-spec')()
var specs    = require('./specs')

specify.runWithDefaults(specs, reporter)
