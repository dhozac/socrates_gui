#!/usr/bin/env python
import os
import sys

if __name__ == "__main__":
    #from gevent import monkey
    #monkey.patch_all()

    from celery import Celery
    app = Celery('bonk')
    app.conf.task_always_eager = True
    app.conf.task_eager_propagates = True
    app.conf.broker_url = 'memory://'
    app.conf.result_backend = 'db+sqlite://' + os.path.join(os.path.dirname(__file__), "celery.db")

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "test_settings")
    from django.conf import settings
    app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)

    try:
        from django.core.management import execute_from_command_line
    except ImportError:
        # The above import may fail for some other reason. Ensure that the
        # issue is really that Django is missing to avoid masking other
        # exceptions on Python 2.
        try:
            import django
        except ImportError:
            raise ImportError(
                "Couldn't import Django. Are you sure it's installed and "
                "available on your PYTHONPATH environment variable? Did you "
                "forget to activate a virtual environment?"
            )
        raise

    if len(sys.argv) > 1 and sys.argv[1] == "collectstatic":
        # This is to get around keeping the package.json for npm in
        # the package. node_modules will exist in the package as
        # well, so that needs to be the current working directory.
        os.environ["NODE_PATH"] = os.path.abspath(os.path.join(os.path.dirname(__file__), "socrates_gui", "node_modules"))
        os.chdir(os.path.join(os.path.dirname(__file__), "socrates_gui"))

    execute_from_command_line(sys.argv)
