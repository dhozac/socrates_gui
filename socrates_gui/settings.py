# Copyright 2015-2018 Klarna Bank AB
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os

STATICFILES_STORAGE = 'pipeline.storage.PipelineCachedStorage'

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'pipeline.finders.PipelineFinder',
)

STATICFILES_DIRS = [
    os.path.join(os.path.dirname(__file__), 'node_modules', 'bootstrap', 'dist'),
]

PIPELINE_COMPILERS = (
    'pipeline_browserify.compiler.BrowserifyCompiler',
)

PIPELINE_CSS_COMPRESSOR = 'pipeline.compressors.NoopCompressor'
PIPELINE_JS_COMPRESSOR = 'pipeline.compressors.uglifyjs.UglifyJSCompressor'

PIPELINE_BROWSERIFY_ARGUMENTS = '-t [ babelify --presets [ es2015 react ] ]'

PIPELINE_CSS = {
    'socrates_css': {
        'source_filenames': (
            'css/style.css',
        ),
        'output_filename': 'css/socrates.css',
    },
}

PIPELINE_JS = {
    'socrates_js': {
        'source_filenames': (
            'node_modules/jquery/dist/jquery.min.js',
            'node_modules/bootstrap/dist/js/bootstrap.min.js',
            'node_modules/react/dist/react-with-addons.min.js',
            'js/app.socrates.browserify.js',
        ),
        'output_filename': 'js/socrates.js',
    },
    'spice_html5_js': {
        'source_filenames': (
            'js/app.spice-html5.browserify.js',
        ),
        'output_filename': 'js/spice-html5.js',
    },
}

PIPELINE = {
    'JAVASCRIPT': PIPELINE_JS,
    'STYLESHEETS': PIPELINE_CSS,
    'COMPILERS': PIPELINE_COMPILERS,
    'BROWSERIFY_BINARY': 'browserify',
    'BROWSERIFY_ARGUMENTS': PIPELINE_BROWSERIFY_ARGUMENTS,
    'JS_COMPRESSOR': PIPELINE_JS_COMPRESSOR,
    'CSS_COMPRESSOR': PIPELINE_CSS_COMPRESSOR,
}
