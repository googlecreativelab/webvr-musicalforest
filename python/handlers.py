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
import json
import logging
import country_servers

from base import handlers

# Minimal set of handlers to let you display main page with examples
class RootHandler(handlers.BaseHandler):

  def get(self):

    self.render('index.html')

class ConfigHandler(handlers.BaseHandler):

  def get(self):
    servers = country_servers.get_all_servers()
    country = self.request.headers.get("X-AppEngine-Country")
    region = country_servers.get_region_for_country(country)

    self.response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
    self.render('config.template', { 'default_region': region, 'servers': servers })

class CspHandler(handlers.BaseAjaxHandler):

  def post(self):
    try:
      report = json.loads(self.request.body)
      logging.warn('CSP Violation: %s' % (json.dumps(report['csp-report'])))
      self.render_json({})
    except:
      self.render_json({'error': 'invalid CSP report'})
