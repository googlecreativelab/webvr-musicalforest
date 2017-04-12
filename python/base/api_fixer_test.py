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
"""Tests for base.api_fixer."""

import json
import pickle
import unittest2
import yaml

import api_fixer


class BadPickle(object):
  """Dummy object."""
  def __reduce__(self):
    return tuple([eval, tuple(['[1][2]'])])


class ApiFixerTest(unittest2.TestCase):
  """Test cases for base.api_fixer."""

  def testJsonEscaping(self):
    o = {'foo': '<script>alert(1);</script>'}
    self.assertFalse('<' in json.dumps(o))

  def testYamlLoading(self):
    unsafe = '!!python/object/apply:os.system ["ls"]'
    try:
      yaml.load(unsafe)
      self.fail('loading unsafe YAML object succeeded')
    except yaml.constructor.ConstructorError:
      pass

  def testPickle(self):
    b = { 'foo': BadPickle() }
    s = pickle.dumps(b)
    try:
      b = pickle.loads(s)
      self.fail('BadPickle() loaded successfully')
    except IndexError:
      self.fail('pickled code execution')
    except api_fixer.ApiSecurityException:
      pass

    foo = { 'bar': [1, 2, 3] }
    s = pickle.dumps(foo)
    try:
      foo = pickle.loads(s)
      self.assertEqual(foo['bar'][0], 1)
    except Exception:
      self.fail('safe unpickling failed')


if __name__ == '__main__':
  unittest2.main()
