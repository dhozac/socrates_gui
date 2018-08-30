from django.conf.urls import include, url

urlpatterns = [
    url(r'', include('django_rethink.urls', namespace='django_rethink')),
    url(r'^bonk/', include('bonk.urls', namespace='bonk')),
    url(r'', include('socrates_api.urls', namespace='socrates_api')),
    url(r'^gui/', include('socrates_gui.urls', namespace='socrates_gui')),
    url(r'^auth/', include('rest_framework.urls')),
]
