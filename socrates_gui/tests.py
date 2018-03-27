# Copyright 2018 Klarna Bank AB
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

from django.conf import settings
from django.core import management
from django.test import override_settings
from django.urls import reverse
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium.webdriver.firefox.webdriver import WebDriver
import rethinkdb as r

class SeleniumTests(StaticLiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super(SeleniumTests, cls).setUpClass()
        cls.selenium = WebDriver()
        cls.selenium.implicitly_wait(10)
        cls.conn = r.connect(host=settings.RETHINK_DB_HOST, port=settings.RETHINK_DB_PORT)
        try:
            r.db_drop(settings.RETHINK_DB_DB).run(cls.conn)
        except:
            pass
        r.db_create(settings.RETHINK_DB_DB).run(cls.conn)
        cls.conn.db = settings.RETHINK_DB_DB
        management.call_command('syncrethinkdb', verbosity=0)

    @classmethod
    def tearDownClass(cls):
        cls.selenium.quit()
        super(SeleniumTests, cls).tearDownClass()

    def test_page_load(self):
        self.selenium.get('%s%s' % (self.live_server_url, reverse('socrates_gui:home_view')))
        app = self.selenium.find_element_by_id("socrates_app")
