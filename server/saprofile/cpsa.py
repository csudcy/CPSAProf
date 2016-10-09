"""
Example of how to setup a cherrypy/sqlalchemy profiler
"""
import logging

import cherrypy

from .publisher import Publisher
from .profilers.saprofiler import SAProfiler
from .profilers.cpprofiler import CPProfiler

logger = logging.getLogger(__name__)


class CPSA(object):
    def __init__(self):
        self._publisher = Publisher()
        self._cp_profiler = CPProfiler(self._publisher)
        self._sa_profiler = SAProfiler(self._publisher, self._cp_profiler)

    @cherrypy.expose
    def index(self):
        return 'TODO: Return a nice frontend'

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def data(self, id):
        return self._publisher.get_client_data(id)
