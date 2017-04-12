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
"""Main application entry point."""

import base.api_fixer

import webapp2

import base
import base.constants
import handlers

# These should all inherit from base.handlers.BaseHandler
_UNAUTHENTICATED_ROUTES = [
    ('/', handlers.RootHandler),
    ('/config.js', handlers.ConfigHandler)
]

# These should all inherit from base.handlers.BaseAjaxHandler
_UNAUTHENTICATED_AJAX_ROUTES = [('/csp', handlers.CspHandler)]

# These should all inherit from base.handlers.AuthenticatedHandler
_USER_ROUTES = []

# These should all inherit from base.handlers.AuthenticatedAjaxHandler
_AJAX_ROUTES = []

# These should all inherit from base.handlers.AdminHandler
_ADMIN_ROUTES = []

# These should all inherit from base.handlers.AdminAjaxHandler
_ADMIN_AJAX_ROUTES = []

# These should all inherit from base.handlers.BaseCronHandler
_CRON_ROUTES = []

# These should all inherit from base.handlers.BaseTaskHandler
_TASK_ROUTES = []

# Place global application configuration settings (e.g. settings for
# 'webapp2_extras.sessions') here.
#
# These values will be accessible from handler methods like this:
# self.app.config.get('foo')
#
# Framework level settings:
#   template: one of base.constants.CLOSURE (default), base.constants.DJANGO,
#             or base.constants.JINJA.
#
#   using_angular: True or False (default).  When True, an XSRF-TOKEN cookie
#                  will be set for interception/use by Angular's $http service.
#                  When False, no header will be set (but an XSRF token will
#                  still be available under the _xsrf key for Django/Jinja
#                  templates).  If you set this to True, be especially careful
#                  when mixing Angular and any server side templates:
#                    https://github.com/angular/angular.js/issues/5601
#                  See the summary by IgorMinar for details.
#
#   framing_policy: one of base.constants.DENY (default),
#                   base.constants.SAMEORIGIN, or base.constants.PERMIT
#
#   hsts_policy:    A dictionary with minimally a 'max_age' key, and optionally
#                   a 'includeSubdomains' boolean member.
#                   Default: { 'max_age': 2592000, 'includeSubDomains': True }
#                   implying 30 days of strict HTTPS for all subdomains.
#
#   csp_policy:     A dictionary with keys that correspond to valid CSP
#                   directives, as defined in the W3C CSP 3 spec.  Each
#                   key/value pair is transmitted as a distinct
#                   Content-Security-Policy header.
#                   Default: {'default-src': '\'self\''}
#                   which is a very restrictive policy.  An optional
#                   'reportOnly' boolean key substitutes a
#                   'Content-Security-Policy-Report-Only' header
#                   name in lieu of 'Content-Security-Policy' (the default
#                   is base.constants.DEBUG).
#
#  Note that the default values are also configured in app.yaml for files
#  served via the /static/ resources.  You may need to change the settings
#  there as well.

_CONFIG = {
    'template': base.constants.JINJA2,
    # Developers are encouraged to build sites that comply with this CSP policy.
    # Changing the first two entries (nonce, strict-dynamic) of the script-src
    # directive may render XSS protection invalid! For more information take a
    # look here https://www.w3.org/TR/CSP3/#strict-dynamic-usage
    # With this policy, modern browsers will execute only those scripts whose
    # nonce attribute matches the value set in the policy header, as well as
    # scripts dynamically added to the page by scripts with the proper nonce.
    # Older browsers, which don't support the CSP3 standard, will ignore the
    # nonce-* and 'strict-dynamic' keywords and fall back to [script-src
    # 'unsafe-inline' https: http:] which will not provide protection against
    # XSS vulnerabilities, but will allow the application to function properly.
    'csp_policy': {
        # Disallow Flash, etc.
        'object-src': '\'none\'',
        # Strict CSP with fallbacks for browsers not supporting CSP v3.
        'script-src': # Propagate trust to dynamically created scripts.
                      # '\'strict-dynamic\' '
                      # Fallback. Ignored in presence of a nonce
                      # '\'unsafe-inline\' '
                      '\'unsafe-eval\' '
                      # Fallback. Ignored in presence of strict-dynamic.
                      'https: http:',
        'report-uri': '/csp',
        'reportOnly': base.constants.DEBUG,
    }
}

#################################
# DO NOT MODIFY BELOW THIS LINE #
#################################

app = webapp2.WSGIApplication(
    routes=(_UNAUTHENTICATED_ROUTES + _UNAUTHENTICATED_AJAX_ROUTES +
            _USER_ROUTES + _AJAX_ROUTES + _ADMIN_ROUTES + _ADMIN_AJAX_ROUTES +
            _CRON_ROUTES + _TASK_ROUTES),
    debug=base.constants.DEBUG,
    config=_CONFIG)
