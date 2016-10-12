import logging

import cherrypy

logger = logging.getLogger(__name__)


# Bind one tool to multiple hooks
class CPProfilerTool(cherrypy.Tool):
    def __init__(self, cpprofiler):
        self._cpprofiler = cpprofiler
        cherrypy.Tool.__init__(
            self,
            'before_handler',
            cpprofiler._publish,
        )

    def _setup(self):
        cherrypy.Tool._setup(self)
        cherrypy.request.hooks.attach(
            'before_finalize',
            self._cpprofiler._publish,
        )


class CPProfiler(object):
    def __init__(self, publisher, exclude=('/favicon.ico', )):
        self._publisher = publisher
        self._exclude = exclude
        self._register_events()
        # Turn on globally
        cherrypy.config.update({
            'tools.cpprofiler.on': True,
        })

    def _register_events(self):
        cherrypy.tools.cpprofiler = CPProfilerTool(self)

    def _publish(self):
        url = cherrypy.request.path_info
        print '_publish', url
        if url in self._exclude:
            return

        # Can't get length from generators so have to catch that
        try:
            response_body_length = len(cherrypy.response.body)
        except Exception:
            response_body_length = None

        self._publisher.publish_request(
            self.get_current_id(),
            {
                'request': {
                    'ip': cherrypy.request.remote.ip,
                    'method': cherrypy.request.method,
                    'params': cherrypy.request.params,
                    'url': cherrypy.request.path_info,
                },
                'response': {
                    'body_length': response_body_length,
                    'status': cherrypy.response.status,
                    'stream': cherrypy.response.stream,
                }
            }
        )

    def get_current_id(self):
        return id(cherrypy.request)
