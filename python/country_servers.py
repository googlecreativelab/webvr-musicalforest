# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import sys
from random import randint
from google.appengine.ext import ndb
import logging

# the top level of your domain in which you'll run backend servers, e.g. your-domain.com
domain = '<insert-your-domain-without-host-part>'

# regions you might have treehouse servers in.
# each of these must be running an instance of the app in 'backend'
# with DNS set up appropriately (e.g. forest-rooms-us.your-domain.com).
us = 'us'
asia = 'asia'
europe = 'europe'


# next we get the list of countries mapped to server they should use,
# if there's a regional server for that region. country list is
# derived from http://dev.maxmind.com/static/csv/codes/country_continent.csv
# & mapped to us/asia/europe thus:
# NA -> us
# SA -> us
# EU -> eu
# AF -> eu
# AS -> as
# OC -> as
# AN -> us

country_to_server_map = {
    'A1': us,
    'A2': us,
    'AD': europe,
    'AE': asia,
    'AF': asia,
    'AG': us,
    'AI': us,
    'AL': europe,
    'AM': asia,
    'AN': us,
    'AO': europe,
    'AP': asia,
    'AQ': us,
    'AR': us,
    'AS': asia,
    'AT': europe,
    'AU': asia,
    'AW': us,
    'AX': europe,
    'AZ': asia,
    'BA': europe,
    'BB': us,
    'BD': asia,
    'BE': europe,
    'BF': europe,
    'BG': europe,
    'BH': asia,
    'BI': europe,
    'BJ': europe,
    'BL': us,
    'BM': us,
    'BN': asia,
    'BO': us,
    'BR': us,
    'BS': us,
    'BT': asia,
    'BV': us,
    'BW': europe,
    'BY': europe,
    'BZ': us,
    'CA': us,
    'CC': asia,
    'CD': europe,
    'CF': europe,
    'CG': europe,
    'CH': europe,
    'CI': europe,
    'CK': asia,
    'CL': us,
    'CM': europe,
    'CN': asia,
    'CO': us,
    'CR': us,
    'CU': us,
    'CV': europe,
    'CX': asia,
    'CY': asia,
    'CZ': europe,
    'DE': europe,
    'DJ': europe,
    'DK': europe,
    'DM': us,
    'DO': us,
    'DZ': europe,
    'EC': us,
    'EE': europe,
    'EG': europe,
    'EH': europe,
    'ER': europe,
    'ES': europe,
    'ET': europe,
    'EU': europe,
    'FI': europe,
    'FJ': asia,
    'FK': us,
    'FM': asia,
    'FO': europe,
    'FR': europe,
    'FX': europe,
    'GA': europe,
    'GB': europe,
    'GD': us,
    'GE': asia,
    'GF': us,
    'GG': europe,
    'GH': europe,
    'GI': europe,
    'GL': us,
    'GM': europe,
    'GN': europe,
    'GP': us,
    'GQ': europe,
    'GR': europe,
    'GS': us,
    'GT': us,
    'GU': asia,
    'GW': europe,
    'GY': us,
    'HK': asia,
    'HM': us,
    'HN': us,
    'HR': europe,
    'HT': us,
    'HU': europe,
    'ID': asia,
    'IE': europe,
    'IL': asia,
    'IM': europe,
    'IN': asia,
    'IO': asia,
    'IQ': asia,
    'IR': asia,
    'IS': europe,
    'IT': europe,
    'JE': europe,
    'JM': us,
    'JO': asia,
    'JP': asia,
    'KE': europe,
    'KG': asia,
    'KH': asia,
    'KI': asia,
    'KM': europe,
    'KN': us,
    'KP': asia,
    'KR': asia,
    'KW': asia,
    'KY': us,
    'KZ': asia,
    'LA': asia,
    'LB': asia,
    'LC': us,
    'LI': europe,
    'LK': asia,
    'LR': europe,
    'LS': europe,
    'LT': europe,
    'LU': europe,
    'LV': europe,
    'LY': europe,
    'MA': europe,
    'MC': europe,
    'MD': europe,
    'ME': europe,
    'MF': us,
    'MG': europe,
    'MH': asia,
    'MK': europe,
    'ML': europe,
    'MM': asia,
    'MN': asia,
    'MO': asia,
    'MP': asia,
    'MQ': us,
    'MR': europe,
    'MS': us,
    'MT': europe,
    'MU': europe,
    'MV': asia,
    'MW': europe,
    'MX': us,
    'MY': asia,
    'MZ': europe,
    'NA': europe,
    'NC': asia,
    'NE': europe,
    'NF': asia,
    'NG': europe,
    'NI': us,
    'NL': europe,
    'NO': europe,
    'NP': asia,
    'NR': asia,
    'NU': asia,
    'NZ': asia,
    'O1': us,
    'OM': asia,
    'PA': us,
    'PE': us,
    'PF': asia,
    'PG': asia,
    'PH': asia,
    'PK': asia,
    'PL': europe,
    'PM': us,
    'PN': asia,
    'PR': us,
    'PS': asia,
    'PT': europe,
    'PW': asia,
    'PY': us,
    'QA': asia,
    'RE': europe,
    'RO': europe,
    'RS': europe,
    'RU': europe,
    'RW': europe,
    'SA': asia,
    'SB': asia,
    'SC': europe,
    'SD': europe,
    'SE': europe,
    'SG': asia,
    'SH': europe,
    'SI': europe,
    'SJ': europe,
    'SK': europe,
    'SL': europe,
    'SM': europe,
    'SN': europe,
    'SO': europe,
    'SR': us,
    'ST': europe,
    'SV': us,
    'SY': asia,
    'SZ': europe,
    'TC': us,
    'TD': europe,
    'TF': us,
    'TG': europe,
    'TH': asia,
    'TJ': asia,
    'TK': asia,
    'TL': asia,
    'TM': asia,
    'TN': europe,
    'TO': asia,
    'TR': europe,
    'TT': us,
    'TV': asia,
    'TW': asia,
    'TZ': europe,
    'UA': europe,
    'UG': europe,
    'UM': asia,
    'US': us,
    'UY': us,
    'UZ': asia,
    'VA': europe,
    'VC': us,
    'VE': us,
    'VG': us,
    'VI': us,
    'VN': asia,
    'VU': asia,
    'WF': asia,
    'WS': asia,
    'YE': asia,
    'YT': europe,
    'ZA': europe,
    'ZM': europe,
    'ZW': europe,
    'ZZ': us
}


def get_region_for_country( client_country ):
    region = country_to_server_map[client_country.upper()]
    if region is None:
        region = 'us'

    return region

def get_all_servers():
    servers = RegionalRoomServer.query().fetch(10)

    if servers is None or len(servers) == 0:
        servers = []
        server = RegionalRoomServer()
        server.name = 'us'
        # you'll need to modify this appropriately for your deployment setup
        server.hostname = 'forest-rooms-' + server.name + '.' + domain
        server.put()

        servers.append(server)
        logging.info("Auto populated datastore")
    return servers



class RegionalRoomServer(ndb.Model):
    name = ndb.StringProperty('name', indexed=True)
    hostname = ndb.StringProperty('hostname', indexed=True)


if __name__ == "__main__":
    if len( sys.argv ) == 2:
        print get_server_for_country( sys.argv[ 1 ] )
