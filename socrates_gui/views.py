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

from __future__ import unicode_literals
import traceback
import logging
from django.shortcuts import render
from django.views.generic import FormView, DetailView
from django.views.generic.base import TemplateView
from django.core.exceptions import PermissionDenied
from django.utils.decorators import method_decorator
from django.utils.safestring import mark_safe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from django_rethink import *
from socrates_api.tasks import *
from socrates_api.serializers import *

logger = logging.getLogger("socrates.gui.views")

class AssetConsolePermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return (view.get_serializer(obj).has_write_permission(request.user) and
                (request.user.is_superuser or request.user.is_console_user or
                 obj['asset_type'] == 'vm'))

class AssetConsoleView(RethinkAPIMixin, GenericAPIView):
    table_name = 'assets'
    slug_index_name = 'service_tag'
    group_filter_fields = ['owner', 'managers']
    serializer_class = AssetSerializer
    permission_classes = (permissions.IsAuthenticated, AssetConsolePermission)
    def get(self, request, format=None, slug=None):
        context = {'object': self.get_object()}
        if context['object']['asset_type'] == 'server':
            context['hostname'] = "%s.%s" % (context['object']['service_tag'], settings.SOCRATES_OOB_DOMAIN)
            context['is_idrac6'] = any([context['object']['model'].startswith(model) for model in ["PowerEdge R310", "PowerEdge R610", "PowerEdge R710", "PowerEdge R910"]])
            response = render(request, 'asset_console.jnlp', context=context, content_type='application/x-java-jnlp-file')
            response['Content-Disposition'] = 'attachment; filename="viewer.jnlp"'
            return response
        elif context['object']['asset_type'] == 'vm' and context['object']['asset_subtype'] == 'libvirt':
            return render(request, 'asset_console_spice.html', context=context)
        else:
            return Response(status=status.HTTP_501_NOT_IMPLEMENTED)

class AssetManagementRedirectView(RethinkAPIMixin, GenericAPIView):
    table_name = 'assets'
    slug_index_name = 'service_tag'
    group_filter_fields = ['owner', 'managers']
    serializer_class = AssetSerializer
    permission_classes = (permissions.IsAuthenticated, AssetConsolePermission)
    def get(self, request, format=None, slug=None):
        return Response(status=status.HTTP_302_FOUND, headers={'Location': 'https://' + slug + '.' + settings.SOCRATES_OOB_DOMAIN})

class ReactView(TemplateView):
    template_name = 'app.html'

class ReQLView(RethinkAPIMixin, APIView):
    permission_classes = (permissions.IsAuthenticated, permissions.IsAdminUser)
    def post(self, request, format=None):
        try:
            query = eval(request.data["query"], {'r': r})
        except:
            return Response({'query': [traceback.format_exc()]}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(query, r.RqlQuery):
            return Response({'query': ["query didn't result in a RqlQuery object: %s" % type(query)]}, status=status.HTTP_400_BAD_REQUEST)
        logger.warning("%s executed %s" % (request.user.username, request.data["query"]))
        try:
            result = query.run(get_connection())
            if isinstance(result, r.errors.ReqlCursorEmpty):
                result = list(result)
        except:
            return Response({'query': [traceback.format_exc()]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)
