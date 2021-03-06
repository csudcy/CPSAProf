"""
Example of how to setup a cherrypy/sqlalchemy profiler
"""
import hashlib
import logging
import os

import cherrypy

from .publisher import Publisher
from .profilers.saprofiler import SAProfiler
from .profilers.cpprofiler import CPProfiler

logger = logging.getLogger(__name__)

HERE = os.path.dirname(os.path.abspath(__file__))
STATIC = os.path.join(HERE, 'static')


def generate_id(obj):
    return hashlib.md5(str(id(obj))).hexdigest()[:6]


class CPSA(object):
    def __init__(self):
        self._publisher = Publisher()
        self._cp_profiler = CPProfiler(generate_id, self._publisher)
        self._sa_profiler = SAProfiler(generate_id, self._publisher, self._cp_profiler)

    @cherrypy.expose
    def index(self):
        return cherrypy.lib.static.serve_file(
            os.path.join(STATIC, 'cpsa.html'),
            # content_type='application/xml'
        )

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def register(self, include_existing_data=False):
        return self._publisher.add_client(include_existing_data)

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def unregister(self, id):
        return self._publisher.remove_client(id)

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def data(self, id):
        return self._publisher.get_client_data(id)


def mount(prefix='/cpsa/'):
    cherrypy.tree.mount(
        CPSA(),
        '/cpsa/',
        config={
            '/': {
                'tools.cpprofiler.on': False,
            },
            '/static': {
                'tools.staticdir.on': True,
                'tools.staticdir.dir': STATIC,
            }
        }
    )
