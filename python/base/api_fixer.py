# Copyright 2014 Google Inc. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
#     Unless required by applicable law or agreed to in writing, software
#     distributed under the License is distributed on an "AS IS" BASIS,
#     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#     See the License for the specific language governing permissions and
#     limitations under the License.
"""Fixes up various popular APIs to ensure they use secure defaults."""

import __builtin__
import constants
import cPickle
import functools
import io
import json
import logging
import pickle
import yaml

from google.appengine.api import urlfetch
from webapp2_extras import sessions


class ApiSecurityException(Exception):
  """Error when attempting to call an unsafe API."""
  pass


def FindArgumentIndex(function, argument):
  args = function.func_code.co_varnames[:function.func_code.co_argcount]
  return args.index(argument)


def GetDefaultArgument(function, argument):
  argument_index = FindArgumentIndex(function, argument)
  num_positional_args = (function.func_code.co_argcount -
                         len(function.func_defaults))
  default_position = argument_index - num_positional_args
  if default_position < 0:
    return None
  return function.func_defaults[default_position]


def ReplaceDefaultArgument(function, argument, replacement):
  argument_index = FindArgumentIndex(function, argument)
  num_positional_args = (function.func_code.co_argcount -
                         len(function.func_defaults))
  default_position = argument_index - num_positional_args
  if default_position < 0:
    raise ApiSecurityException('Attempt to modify positional default value')
  new_defaults = list(function.func_defaults)
  new_defaults[default_position] = replacement
  function.func_defaults = tuple(new_defaults)


# JSON.
# Does not escape HTML metacharacters by default.
_JSON_CHARACTER_REPLACEMENT_MAPPING = [
    ('<', '\\u%04x' % ord('<')),
    ('>', '\\u%04x' % ord('>')),
    ('&', '\\u%04x' % ord('&')),
]


class _JsonEncoderForHtml(json.JSONEncoder):

  def encode(self, o):
    chunks = self.iterencode(o, _one_shot=True)
    if not isinstance(chunks, (list, tuple)):
      chunks = list(chunks)
    return ''.join(chunks)

  def iterencode(self, o, _one_shot=False):
    chunks = super(_JsonEncoderForHtml, self).iterencode(o, _one_shot)
    for chunk in chunks:
      for (character, replacement) in _JSON_CHARACTER_REPLACEMENT_MAPPING:
        chunk = chunk.replace(character, replacement)
      yield chunk


ReplaceDefaultArgument(json.dump, 'cls', _JsonEncoderForHtml)
ReplaceDefaultArgument(json.dumps, 'cls', _JsonEncoderForHtml)


# Pickle.  See http://www.cs.jhu.edu/~s/musings/pickle.html for more info.
# Whitelist of module name => (module, [list of safe names])
_PICKLE_CLASS_WHITELIST = { '__builtin__': (__builtin__,
                                            ['basestring',
                                             'bool',
                                             'buffer',
                                             'bytearray',
                                             'bytes',
                                             'complex',
                                             'dict',
                                             'enumerate',
                                             'float',
                                             'frozenset',
                                             'int',
                                             'list',
                                             'long',
                                             'reversed',
                                             'set',
                                             'slice',
                                             'str',
                                             'tuple',
                                             'unicode',
                                             'xrange']),
                           }

# See https://docs.python.org/3/library/pickle.html#restricting-globals.
class RestrictedUnpickler(pickle.Unpickler):

  def find_class(self, module_name, name):
    (module, safe_names) = _PICKLE_CLASS_WHITELIST.get(module_name, (None, []))
    if name in safe_names:
      return getattr(module, name)
    raise ApiSecurityException('%s.%s forbidden in unpickling' % (module, name))

def _SafePickleLoad(f):
  return RestrictedUnpickler(f).load()

def _SafePickleLoads(string):
  return RestrictedUnpickler(io.BytesIO(string)).load()

pickle.load = _SafePickleLoad
pickle.loads = _SafePickleLoads
cPickle.load = _SafePickleLoad
cPickle.loads = _SafePickleLoads


# YAML.  The Python tag scheme allows arbitrary code execution:
# yaml.load('!!python/object/apply:os.system ["ls"]')
ReplaceDefaultArgument(yaml.compose, 'Loader', yaml.loader.SafeLoader)
ReplaceDefaultArgument(yaml.compose_all, 'Loader', yaml.loader.SafeLoader)
ReplaceDefaultArgument(yaml.load, 'Loader', yaml.loader.SafeLoader)
ReplaceDefaultArgument(yaml.load_all, 'Loader', yaml.loader.SafeLoader)
ReplaceDefaultArgument(yaml.parse, 'Loader', yaml.loader.SafeLoader)
ReplaceDefaultArgument(yaml.scan, 'Loader', yaml.loader.SafeLoader)


# AppEngine urlfetch.
# Does not validate certificates by default.
ReplaceDefaultArgument(urlfetch.fetch, 'validate_certificate', True)
ReplaceDefaultArgument(urlfetch.make_fetch_call, 'validate_certificate', True)


def _HttpUrlLoggingWrapper(func):
  """Decorates func, logging when 'url' params do not start with https://."""
  @functools.wraps(func)
  def _CheckAndLog(*args, **kwargs):
    try:
      arg_index = FindArgumentIndex(func, 'url')
    except ValueError:
      return func(*args, **kwargs)

    if arg_index < len(args):
      arg_value = args[arg_index]
    elif 'url' in kwargs:
      arg_value = kwargs['url']
    elif 'url' not in kwargs:
      arg_value = GetDefaultArgument(func, 'url')

    if arg_value and not arg_value.startswith('https://'):
      logging.warn('SECURITY : fetching non-HTTPS url %s' % (arg_value))
    return func(*args, **kwargs)
  return _CheckAndLog

urlfetch.fetch = _HttpUrlLoggingWrapper(urlfetch.fetch)
urlfetch.make_fetch_call = _HttpUrlLoggingWrapper(urlfetch.make_fetch_call)

# webapp2_extras session does not set HttpOnly/Secure by default.
sessions.default_config['cookie_args']['secure'] = (not
                                                    constants.IS_DEV_APPSERVER)
sessions.default_config['cookie_args']['httponly'] = True

