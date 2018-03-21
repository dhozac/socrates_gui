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

import random
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "socrates.settings")
import django
django.setup()
from django.core import management
management.call_command('migrate', verbosity=0)
from django.contrib.auth import authenticate
from socrates_api.serializers import AssetSerializer
from socrates_api.tasks import *
from websockify.auth_plugins import AuthenticationError

class SocratesHost(str):
    def __new__(cls, host, asset):
        obj = str.__new__(cls, host)
        obj.asset = asset
        return obj

class SocratesTokenPlugin(object):
    def __init__(self, src=None):
        pass
    def lookup(self, token):
        asset = AssetSerializer.get(id=token)
        if asset['asset_type'] == "vm" and asset['asset_subtype'] == "libvirt":
            parent_asset = AssetSerializer.get(service_tag=asset['parent'])
            api = connect_hypervisor_libvirt(parent_asset)
            vm = find_vm_libvirt(api, asset)
            if vm.isActive():
                root = etree.fromstring(vm.XMLDesc())
                graphics = root.xpath("/domain/devices/graphics")[0]
                host = graphics.attrib['listen']
                port = graphics.attrib['port']
                if host == "127.0.0.1" and parent_asset['url'].startswith("qemu+ssh://"):
                    url = urlparse.urlparse(parent_asset['url'])
                    # FIXME: random sucks...
                    local_port = random.randint(5900, 7000)
                    subprocess.call(["ssh", "-f", "-T", "-L", "%d:%s:%s" % (local_port, host, port), url.netloc, "sleep", "10"])
                    port = local_port
            api.close()
        return SocratesHost(host, asset), port

class SocratesAuthPlugin(object):
    def __init__(self, src=None):
        self.src = src

    def authenticate(self, headers, target_host, target_port):
        import base64
        auth_header = headers.get('Authorization')
        if auth_header:
            if not auth_header.startswith('Basic '):
                raise AuthenticationError(response_code=403)

            try:
                user_pass_raw = base64.b64decode(auth_header[6:])
            except TypeError:
                raise AuthenticationError(response_code=403)

            try:
                # http://stackoverflow.com/questions/7242316/what-encoding-should-i-use-for-http-basic-authentication
                user_pass_as_text = user_pass_raw.decode('ISO-8859-1')
            except UnicodeDecodeError:
                raise AuthenticationError(response_code=403)

            user_pass = user_pass_as_text.split(':', 1)
            if len(user_pass) != 2:
                raise AuthenticationError(response_code=403)

            user = authenticate(username=user_pass[0], password=user_pass[1])
            if user is None:
                raise AuthenticationError(response_code=403)

            if not AssetSerializer(target_host.asset).has_write_permission(user):
                raise AuthenticationError(response_code=403)

        else:
            raise AuthenticationError(response_code=401,
                                      response_headers={'WWW-Authenticate': 'Basic realm="api"'})
