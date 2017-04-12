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
"""Tests for base.xsrf."""

import os
import time
import unittest2

import xsrf


class XsrfTest(unittest2.TestCase):
  """Test cases for base.xsrf."""

  def setUp(self):
    # non-deterministic tests FTW!
    self.key = os.urandom(16)

  def testCompare(self):
    self.assertTrue(xsrf._Compare('a', 'a'))
    self.assertFalse(xsrf._Compare('a', 'b'))
    self.assertFalse(xsrf._Compare('a', 'ab'))

  def testTokenWithNoActionVerifies(self):
    token = xsrf.GenerateToken(self.key, 'user')
    self.assertTrue(xsrf.ValidateToken(self.key, 'user', token))

  def testTokenWithDifferentActionsFail(self):
    token = xsrf.GenerateToken(self.key, 'user', 'a')
    self.assertFalse(xsrf.ValidateToken(self.key, 'user', token, 'b'))

  def testTokenWithDifferentUsersFail(self):
    token = xsrf.GenerateToken(self.key, 'user')
    self.assertFalse(xsrf.ValidateToken(self.key, 'otheruser', token))

  def testExpiredTokenDoesNotVerify(self):
    now = int(time.time()) - (xsrf.DEFAULT_TIMEOUT_ + 1)
    token = xsrf.GenerateToken(self.key, 'user', '*', now)
    self.assertFalse(xsrf.ValidateToken(self.key, 'user', token))
    self.assertTrue(xsrf.ValidateToken(self.key, 'user', token, '*',
                                       xsrf.DEFAULT_TIMEOUT_ * 2))


if __name__ == '__main__':
  unittest2.main()
