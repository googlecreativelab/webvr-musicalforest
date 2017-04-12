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
"""A collection of secure base handlers for webapp2-based applications."""

import abc
import base64
import django.conf
import django.template
import django.template.loader
import functools

import json
import webapp2
from webapp2_extras import jinja2

import api_fixer
import constants
import models
import os
import xsrf

from google.appengine.api import memcache
from google.appengine.api import users


# Django initialization.
django.conf.settings.configure(DEBUG=constants.DEBUG,
                               TEMPLATE_DEBUG=constants.DEBUG,
                               TEMPLATE_DIRS=[constants.TEMPLATE_DIR])


# Assorted decorators that can be used inside a webapp2.RequestHandler object
# to assert certain preconditions before entering any method.
def requires_auth(f):
  """A decorator that requires a currently logged in user."""
  @functools.wraps(f)
  def wrapper(self, *args, **kwargs):
    if not users.get_current_user():
      self.DenyAccess()
    else:
      return f(self, *args, **kwargs)
  return wrapper


def requires_admin(f):
  """A decorator that requires a currently logged in administrator."""
  @functools.wraps(f)
  def wrapper(self, *args, **kwargs):
    if not users.is_current_user_admin():
      self.DenyAccess()
    else:
      return f(self, *args, **kwargs)
  return wrapper


def xsrf_protected(f):
  """Decorator to validate XSRF tokens for any verb but GET, HEAD, OPTIONS."""
  @functools.wraps(f)
  def wrapper(self, *args, **kwargs):
    non_xsrf_protected_verbs = ['options', 'head', 'get']
    if (self.request.method.lower() in non_xsrf_protected_verbs or
        self._RequestContainsValidXsrfToken()):
      return f(self, *args, **kwargs)
    else:
      self.XsrfFail()
  return wrapper


# Utility functions.
def _GetXsrfKey():
  """Returns the current key for generating and verifying XSRF tokens."""
  client = memcache.Client()
  xsrf_key = client.get('xsrf_key')
  if not xsrf_key:
    config = models.GetApplicationConfiguration()
    xsrf_key = config.xsrf_key
    client.set('xsrf_key', xsrf_key)
  return xsrf_key


def _GetCspNonce():
  """Returns a random CSP nonce."""
  nonce_length = constants.NONCE_LENGTH
  return base64.b64encode(os.urandom(nonce_length * 2))[:nonce_length]


# Classes with a __metaclass__ of _HandlerMeta may not contain any methods
# with these names.  This is checked when the class is instantiated.
_RESTRICTED_FUNCTION_LIST = [
    'dispatch',
    '_RequestContainsValidXsrfToken',
]

# Classes with these names (and _HandlerMeta as a metaclass) can contain
# functions in the _RESTRICTED_FUNCTION_LIST.  Note that there is no
# package/module specified, so it is possible to bypass this check through
# clever (or malicious) naming.
_RESTRICTED_FUNCTION_CLASS_WHITELIST = [
    'BaseHandler',
    'BaseAjaxHandler',
    'BaseCronHandler',
    'BaseTaskHandler',
    'AuthenticatedHandler',
    'AuthenticatedAjaxHandler',
    'AdminHandler',
    'AdminAjaxHandler',
]

# This prefix is returned on GET requests to any Ajax-like handler.
# It is used to prevent JSON-like responses that may contain non-public
# information from being included in malicious domains, e.g. evil.com
# inserting a tag like: <script src="http://example.com/ajax/foo"></script>.
# evil.com cannot strip this prefix before parsing the result, unlike
# same-origin requests.  See https://google-gruyere.appspot.com/part3
# for more information.  It is not necessary for POST requests because
# there is no way to force the browser to make a cross-domain POST request
# and interpret the response as Javascript without use of other mechanisms
# like Cross-Origin-Resource-Sharing, which is disabled by default.
_XSSI_PREFIX = ')]}\',\n'


class SecurityError(Exception):
  pass


class _HandlerMeta(abc.ABCMeta):
  """Metaclass for our secure base handlers.

  When a class with this metaclass is defined, the fields
  are checked to ensure that certain methods we would like to approximate as
  'final' are not declared in subclasses. This is because we provide a
  default implementation which enforces various security related functionality.

  Class names that can bypass this whitelist are listed in
  _RESTRICTED_FUNCTION_CLASS_WHITELIST.  Restricted methods are listed in
  _RESTRICTED_FUNCTION_LIST.
  """

  def __new__(mcs, name, bases, dct):
    if name not in _RESTRICTED_FUNCTION_CLASS_WHITELIST:
      for func in _RESTRICTED_FUNCTION_LIST:
        if func in dct:
          raise SecurityError('%s attempts to override restricted method %s' %
                              (name, func))
    return super(_HandlerMeta, mcs).__new__(mcs, name, bases, dct)


class BaseHandler(webapp2.RequestHandler):
  """Base handler for servicing unauthenticated user requests."""

  __metaclass__ = _HandlerMeta

  def __init__(self, request, response):
    self.initialize(request, response)
    api_fixer.ReplaceDefaultArgument(response.set_cookie.im_func, 'secure',
                                     not constants.IS_DEV_APPSERVER)
    api_fixer.ReplaceDefaultArgument(response.set_cookie.im_func, 'httponly',
                                     True)
    if self.current_user:
      self._xsrf_token = xsrf.GenerateToken(_GetXsrfKey(),
                                            self.current_user.email())
      if self.app.config.get('using_angular', constants.DEFAULT_ANGULAR):
        # AngularJS requires a JS readable XSRF-TOKEN cookie and will pass this
        # back in AJAX requests.
        self.response.set_cookie('XSRF-TOKEN', self._xsrf_token, httponly=False)
    else:
      self._xsrf_token = None

    self.csp_nonce = _GetCspNonce()

    self._RawWrite = self.response.out.write
    self.response.out.write = self._ReplacementWrite

  # All content should be rendered through a template system to reduce the
  # risk/likelihood of XSS issues.  Access to the original function
  # self.response.out.write is available via self._RawWrite for exceptional
  # circumstances.
  def _ReplacementWrite(*args, **kwargs):
    raise SecurityError('All response content must originate via render() or'
                        'render_json()')

  def _SetCommonResponseHeaders(self):
    """Sets various headers with security implications."""
    frame_policy = self.app.config.get('framing_policy', constants.DENY)
    frame_header_value = constants.X_FRAME_OPTIONS_VALUES.get(frame_policy, '')
    if frame_header_value:
      self.response.headers['X-Frame-Options'] = frame_header_value

    hsts_policy = self.app.config.get('hsts_policy',
                                      constants.DEFAULT_HSTS_POLICY)
    if self.request.scheme.lower() == 'https' and hsts_policy:
      include_subdomains = bool(hsts_policy.get('includeSubdomains', False))
      subdomain_string = '; includeSubdomains' if include_subdomains else ''
      hsts_value = 'max-age=%d%s' % (int(hsts_policy.get('max_age')),
                                     subdomain_string)
      self.response.headers['Strict-Transport-Security'] = hsts_value

    self.response.headers['X-XSS-Protection'] = '1; mode=block'
    self.response.headers['X-Content-Type-Options'] = 'nosniff'

    csp_policy = self.app.config.get('csp_policy', constants.DEFAULT_CSP_POLICY)
    report_only = False
    if 'reportOnly' in csp_policy:
      report_only = csp_policy.get('reportOnly')
      csp_policy = csp_policy.copy()
      del csp_policy['reportOnly']
    header_name = ('Content-Security-Policy%s' %
                   ('-Report-Only' if report_only else ''))
    directives = []
    for (k, v) in csp_policy.iteritems():
      directives.append('%s %s' % (k, v))
    csp = '; '.join(directives)

    # Set random nonce per response
    csp = csp % {'nonce_value': self.csp_nonce}

    self.response.headers.add(header_name, csp)

  @webapp2.cached_property
  def current_user(self):
    return users.get_current_user()

  def dispatch(self):
    self._SetCommonResponseHeaders()
    super(BaseHandler, self).dispatch()


  @classmethod
  def get_jinja2_config(cls):
    """
      Builds Jinja2 config based on constants.

      Note: this is used in the factory below, but an alternative way of setting
      up Jinja2 would be to use the WSGIApplication config to set this and not
      use the factory below. This has the advantage of having different settings
      for different applications and not set here at the handler level.
    """
    extensions = ['jinja2.ext.with_']
    return {
      'environment_args': {
        'autoescape': True,
        'extensions': extensions,
        'auto_reload': constants.DEBUG,
      },
      'template_path': constants.TEMPLATE_DIR
    }

  @staticmethod
  def j2_factory(app):
    """
      The factory function passed to get_jinja2.
      Args:
        app: the WSGIApplication
    """
    return jinja2.Jinja2(app, BaseHandler.get_jinja2_config())

  @webapp2.cached_property
  def jinja2(self):
    """
      Get the cached Jinja2 instance from the app registry, if none exists
      the factory function is used to create one.
    """
    return jinja2.get_jinja2(self.j2_factory, app=self.app)

  def render_to_string(self, template, template_values=None):
    """Renders template_name with template_values and returns as a string."""
    if not template_values:
      template_values = {}

    template_values['_xsrf'] = self._xsrf_token
    template_values['_csp_nonce'] = self.csp_nonce
    template_strategy = self.app.config.get('template', constants.CLOSURE)

    if template_strategy == constants.DJANGO:
      t = django.template.loader.get_template(template)
      template_values = django.template.Context(template_values)
      return t.render(template_values)
    elif template_strategy == constants.JINJA2:
      return self.jinja2.render_template(template, **template_values)
    else:
      ijdata = { 'csp_nonce': self.csp_nonce }
      return template(template_values, ijdata)

  def render(self, template, template_values=None):
    """Renders template with template_values and writes to the response."""
    template_strategy = self.app.config.get('template', constants.CLOSURE)
    self._RawWrite(self.render_to_string(template, template_values))


class BaseCronHandler(BaseHandler):
  """Base handler for servicing Cron requests.

  This handler enforces that inbound requests contain the X-AppEngine-Cron
  header, which AppEngine guarantees is only present on actual invocations
  according to the cron schedule, or crafted requests by an administrator
  of the application (the header is filtered out from normal user requests).
  """

  __metaclass__ = _HandlerMeta

  def dispatch(self):
    header = self.request.headers.get('X-AppEngine-Cron', 'false')
    if header != 'true':
      raise SecurityError('attempt to access cron handler without '
                          'X-AppEngine-Cron header')
    super(BaseCronHandler, self).dispatch()


class BaseTaskHandler(BaseHandler):
  """Base handler for servicing task requests.

  This handler enforces that inbound requests contain the X-AppEngine-QueueName
  header, which AppEngine guarantees is only present on requests from the
  Task Queue API, or crafted requests by an administrator of the application
  (the header is filtered out from normal user requests).
  """

  __metaclass__ = _HandlerMeta

  def dispatch(self):
    header = self.request.headers.get('X-AppEngine-QueueName', None)
    if not header:
      raise SecurityError('attempt to access task handler without '
                          'X-AppEngine-QueueName header')
    super(BaseTaskHandler, self).dispatch()


class BaseAjaxHandler(BaseHandler):
  """Base handler for servicing unauthenticated AJAX requests.

  Responses to GET requests will be prefixed by _XSSI_PREFIX.  Requests
  using other HTTP verbs will not include such a prefix.
  """

  __metaclass__ = _HandlerMeta

  def _SetAjaxResponseHeaders(self):
    self.response.headers['Content-Disposition'] = 'attachment; filename=json'
    self.response.headers['Content-Type'] = 'application/json; charset=utf-8'

  def dispatch(self):
    self._SetAjaxResponseHeaders()
    if self.request.method.lower() == 'get':
      self._RawWrite(_XSSI_PREFIX)
    super(BaseAjaxHandler, self).dispatch()

  def render(self, *args, **kwargs):
    raise SecurityError('AJAX handlers must use render_json()')

  def render_json(self, obj):
    self._RawWrite(json.dumps(obj))


class AuthenticatedHandler(BaseHandler):
  """Base handler for servicing authenticated user requests.

  Implementations should provide an implementation of DenyAccess()
  and XsrfFail() to handle unauthenticated requests or invalid XSRF tokens.

  POST requests will be rejected unless the request contains a
  parameter named 'xsrf' which is a valid XSRF token for the
  currently authenticated user.
  """

  __metaclass__ = _HandlerMeta

  @requires_auth
  @xsrf_protected
  def dispatch(self):
    super(AuthenticatedHandler, self).dispatch()

  def _RequestContainsValidXsrfToken(self):
    token = self.request.get('xsrf') or self.request.headers.get('X-XSRF-TOKEN')
    # By default, Angular's $http service will add quotes around the
    # X-XSRF-TOKEN.
    if (token and
        self.app.config.get('using_angular', constants.DEFAULT_ANGULAR) and
        token[0] == '"' and token[-1] == '"'):
      token = token[1:-1]

    if xsrf.ValidateToken(_GetXsrfKey(), self.current_user.email(),
                          token):
      return True
    return False

  @abc.abstractmethod
  def DenyAccess(self):
    pass

  @abc.abstractmethod
  def XsrfFail(self):
    pass


class AuthenticatedAjaxHandler(BaseAjaxHandler):
  """Base handler for servicing AJAX requests.

  Implementations should provide an implementation of DenyAccess()
  and XsrfFail() to handle unauthenticated requests or invalid XSRF tokens.

  POST requests will be rejected unless the request contains a
  parameter named 'xsrf', OR an HTTP header named 'X-XSRF-Token'
  which is a valid XSRF token for the currently authenticated user.

  Responses to GET requests will be prefixed by _XSSI_PREFIX.  Requests
  using other HTTP verbs will not include such a prefix.
  """

  __metaclass__ = _HandlerMeta

  @requires_auth
  @xsrf_protected
  def dispatch(self):
    super(AuthenticatedAjaxHandler, self).dispatch()

  def _RequestContainsValidXsrfToken(self):
    token = self.request.get('xsrf') or self.request.headers.get('X-XSRF-Token')
    # By default, Angular's $http service will add quotes around the
    # X-XSRF-TOKEN.
    if (token and
        self.app.config.get('using_angular', constants.DEFAULT_ANGULAR) and
        token[0] == '"' and token[-1] == '"'):
      token = token[1:-1]

    if xsrf.ValidateToken(_GetXsrfKey(), self.current_user.email(),
                          token):
      return True
    return False

  @abc.abstractmethod
  def DenyAccess(self):
    pass

  @abc.abstractmethod
  def XsrfFail(self):
    pass


class AdminHandler(AuthenticatedHandler):
  """Base handler for servicing administrator requests.

  Implementations should provide an implementation of DenyAccess()
  and XsrfFail() to handle unauthenticated requests or invalid XSRF tokens.

  Requests will be rejected if the currently logged in user is
  not an administrator.

  POST requests will be rejected unless the request contains a
  parameter named 'xsrf' which is a valid XSRF token for the
  currently authenticated user.
  """

  __metaclass__ = _HandlerMeta

  @requires_admin
  def dispatch(self):
    super(AdminHandler, self).dispatch()


class AdminAjaxHandler(AuthenticatedAjaxHandler):
  """Base handler for servicing AJAX administrator requests.

  Implementations should provide an implementation of DenyAccess()
  and XsrfFail() to handle unauthenticated requests or invalid XSRF tokens.

  Requests will be rejected if the currently logged in user is
  not an administrator.

  POST requests will be rejected unless the request contains a
  parameter named 'xsrf', OR an HTTP header named 'X-XSRF-Token'
  which is a valid XSRF token for the currently authenticated user.

  Responses to GET requests will be prefixed by _XSSI_PREFIX.  Requests
  using other HTTP verbs will not include such a prefix.
  """

  __metaclass__ = _HandlerMeta

  @requires_admin
  def dispatch(self):
    super(AdminAjaxHandler, self).dispatch()
