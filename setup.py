#!/usr/bin/env python

from setuptools import setup
import os
import re

setup(name='socrates_gui',
      version='1.0.3',
      license='Apache Software License',
      description='Source of Truth for hardware, virtual machines, and networks',
      author='Klarna Bank AB',
      author_email='daniel.zakrisson@klarna.com',
      url='https://github.com/dhozac/socrates_gui',
      packages=['socrates_gui'],
      install_requires=[
          'websockify',
          'socrates_api',
          'django-pipeline',
          'django-pipeline-browserify',
      ],
      include_package_data=True,
      zip_safe=False,
      classifiers=[
          'Development Status :: 7 - Inactive',
          'Environment :: Web Environment',
          'Framework :: Django :: 1.11',
          'Intended Audience :: System Administrators',
          'License :: OSI Approved :: Apache Software License',
          'Topic :: System :: Installation/Setup',
      ],
     )
