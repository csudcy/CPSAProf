import logging

import cherrypy

logger = logging.getLogger(__name__)


class CPProfiler(object):
    def __init__(self, publisher):
        self._publisher = publisher
        self._register_events()
        # Turn on globally
        cherrypy.config.update({
            'tools.cpprofiler_on_start_resource.on': True,
            'tools.cpprofiler_before_finalize.on': True,
        })

    def _register_events(self):
        @cherrypy.tools.register('on_start_resource')
        def cpprofiler_on_start_resource():
            logger.debug('on_start_resource')
            self._publish()

        @cherrypy.tools.register('before_finalize')
        def cpprofiler_before_finalize():
            logger.debug('before_finalize')
            self._publish()

    def _publish(self):
        try:
            response_body_length = len(cherrypy.response.body)
        except Exception:
            response_body_length = None
        self._publisher.publish_sql(
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
