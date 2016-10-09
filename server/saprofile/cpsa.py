"""
Example of how to setup a cherrypy/sqlalchemy profiler
"""
import logging
import os

import cherrypy

from .publisher import Publisher
from .profilers.saprofiler import SAProfiler
from .profilers.cpprofiler import CPProfiler

logger = logging.getLogger(__name__)

HERE = os.path.dirname(os.path.abspath(__file__))
STATIC = os.path.join(HERE, 'static')

class CPSA(object):
    def __init__(self):
        self._publisher = Publisher()
        self._cp_profiler = CPProfiler(self._publisher)
        self._sa_profiler = SAProfiler(self._publisher, self._cp_profiler)

    @cherrypy.expose
    def index(self):
        return cherrypy.lib.static.serve_file(
            os.path.join(STATIC, 'cpsa.html'),
            # content_type='application/xml'
        )

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
