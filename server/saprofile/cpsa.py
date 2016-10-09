"""
Example of how to setup a cherrypy/sqlalchemy profiler
"""

from .publisher import Publisher
from .profilers.saprofiler import SAProfiler
from .profilers.cpprofiler import CPProfiler



class CPSA(object):
    def __init__(self):
        self._publisher = Publisher()
        self._cp_profiler = CPProfiler(self._publisher)
        self._sa_profiler = SAProfiler(self._publisher, self._cp_profiler)

    @cherrypy.expose
    def index(self):
        return 'TODO: Return a nice frontend'

    @cherrypy.expose
    def data(self, id):
         return self._publisher.get_client_data(id)

