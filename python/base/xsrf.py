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
"""Utilities related to Cross-Site Request Forgery protection."""

import hashlib
import hmac
import time

DELIMITER_ = ':'
DEFAULT_TIMEOUT_ = 86400


def _Compare(a, b):
  """Compares a and b in constant time and returns True if they are equal."""
  if len(a) != len(b):
    return False
  result = 0
  for x, y in zip(a, b):
    result |= ord(x) ^ ord(y)

  return result == 0


def GenerateToken(key, user, action='*', now=None):
  """Generates an XSRF token for the provided user and action."""
  token_timestamp = now or int(time.time())
  message = DELIMITER_.join([user, action, str(token_timestamp)])
  digest = hmac.new(key, message, hashlib.sha1).hexdigest()
  return DELIMITER_.join([str(token_timestamp), digest])


def ValidateToken(key, user, token, action='*', max_age=DEFAULT_TIMEOUT_):
  """Validates the provided XSRF token."""
  if not token or not user:
    return False
  try:
    (timestamp, digest) = token.split(DELIMITER_)
  except ValueError:
    return False
  expected = GenerateToken(key, user, action, timestamp)
  (_, expected_digest) = expected.split(DELIMITER_)
  now = int(time.time())
  if _Compare(expected_digest, digest) and now < int(timestamp) + max_age:
    return True
  return False
