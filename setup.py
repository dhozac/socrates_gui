#!/usr/bin/env python

import setuptools
from setuptools.command.sdist import sdist
from distutils import log
import os
import subprocess

class my_sdist(sdist):
    def run(self):
        self.run_command('build_npm')
        sdist.run(self)

class build_npm(setuptools.Command):
    def initialize_options(self):
        self.base_path = os.path.dirname(__file__)
    def run(self):
        self.spawn(["npm", "install"])
        self.spawn(["npm", "run", "build"])
        self.copy_tree(os.path.join(self.base_path, "react", "build", "static"), os.path.join(self.base_path, "socrates_gui", "static"))
        self.copy_file(os.path.join(self.base_path, "react", "build", "index.html"), os.path.join(self.base_path, "socrates_gui", "templates"))
    def finalize_options(self):
        pass
    def spawn(self, cmd):
        log.info(" ".join(cmd))
        if not self.dry_run:
            subprocess.check_call(cmd, cwd=os.path.join(self.base_path, "react"))

setuptools.setup(
    name='socrates_gui',
    version='2.1.0',
    license='Apache Software License',
    description='Source of Truth for hardware, virtual machines, and networks',
    author='Klarna Bank AB',
    author_email='daniel.zakrisson@klarna.com',
    url='https://github.com/dhozac/socrates_gui',
    packages=['socrates_gui'],
    install_requires=[
        'websockify',
        'socrates_api',
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
    cmdclass={
        'sdist': my_sdist,
        'build_npm': build_npm,
    },
)
