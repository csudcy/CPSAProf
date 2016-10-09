import logging

logger = logging.getLogger(__name__)


class CPProfiler(object):
    def __init__(self, publisher):
        self._publisher = publisher

    def get_current_id(self):
        # TODO
        return None


# @cherrypy.tools.register('before_finalize')
# def logit():
#     print(cherrypy.request.remote.ip)
