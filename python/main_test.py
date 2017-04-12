# Copyright 2015 Google Inc. All rights reserved.
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
"""Tests for main."""

import unittest2
import webapp2
import webapp2_extras.routes

from base import handlers
import main


class MainTest(unittest2.TestCase):
  """Test cases for main."""

  def _VerifyInheritance(self, routes_list, base_class):
    """Checks that the handlers of the given routes inherit from base_class."""
    router = webapp2.Router(routes_list)
    routes = router.match_routes + router.build_routes.values()
    inheritance_errors = ''
    for route in routes:
      if issubclass(route.__class__, webapp2_extras.routes.MultiRoute):
        self._VerifyInheritance(list(route.get_routes()), base_class)
        continue

      if issubclass(route.handler, webapp2.RedirectHandler):
        continue

      if not issubclass(route.handler, base_class):
        inheritance_errors += '* %s does not inherit from %s.\n' % (
            route.handler.__name__, base_class.__name__)

    return inheritance_errors

  def testRoutesInheritance(self):
    errors = ''
    errors += self._VerifyInheritance(main._UNAUTHENTICATED_ROUTES,
                                      handlers.BaseHandler)
    errors += self._VerifyInheritance(main._UNAUTHENTICATED_AJAX_ROUTES,
                                      handlers.BaseAjaxHandler)
    errors += self._VerifyInheritance(main._USER_ROUTES,
                                      handlers.AuthenticatedHandler)
    errors += self._VerifyInheritance(main._AJAX_ROUTES,
                                      handlers.AuthenticatedAjaxHandler)
    errors += self._VerifyInheritance(main._ADMIN_ROUTES,
                                      handlers.AdminHandler)
    errors += self._VerifyInheritance(main._ADMIN_AJAX_ROUTES,
                                      handlers.AdminAjaxHandler)
    errors += self._VerifyInheritance(main._CRON_ROUTES,
                                      handlers.BaseCronHandler)
    errors += self._VerifyInheritance(main._TASK_ROUTES,
                                      handlers.BaseTaskHandler)
    if errors:
      self.fail('Some handlers do not inherit from the correct classes:\n' +
                errors)

  def testStrictHandlerMethodRouting(self):
    """Checks that handler functions properly limit applicable HTTP methods."""
    router = webapp2.Router(main._USER_ROUTES + main._AJAX_ROUTES +
                            main._ADMIN_ROUTES + main._ADMIN_AJAX_ROUTES)
    routes = router.match_routes + router.build_routes.values()
    failed_routes = []
    while routes:
      route = routes.pop()
      if issubclass(route.__class__, webapp2_extras.routes.MultiRoute):
        routes += list(route.get_routes())
        continue

      if issubclass(route.handler, webapp2.RedirectHandler):
        continue

      if route.handler_method and not route.methods:
        failed_routes.append('%s (%s)' % (route.template,
                                          route.handler.__name__))

    if failed_routes:
      self.fail('Some handlers specify a handler_method but are missing a '
                'methods" attribute and may be vulnerable to XSRF via GET '
                'requests:\n * ' + '\n * '.join(failed_routes))


if __name__ == '__main__':
  unittest2.main()
