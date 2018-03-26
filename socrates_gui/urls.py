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

from django.conf.urls import include, url
from socrates_gui.views import *
urlpatterns = [
    url(r'^asset/(?P<slug>[A-Za-z0-9 -]+?)/console/?$', AssetConsoleView.as_view(), name='asset_console'),
    url(r'^asset/(?P<slug>[A-Za-z0-9 -]+?)/management/?$', AssetManagementRedirectView.as_view(), name='asset_mgmt_redirect'),
    url(r'^reqlapi/$', ReQLView.as_view(), name='reql_view'),
    url(r'^.*', ReactView.as_view(), name='home_view'),
]
