from sqlalchemy import event
from sqlalchemy.engine import Engine


class SAProfiler(object):
    def __init_(self, publisher, request_profiler=None):
        self._publisher = publisher
        self._request_profiler = request_profiler
        self._register_events()

    def _register_events(self):
        @event.listens_for(Engine, 'before_cursor_execute')
        def before_cursor_execute(
                conn,
                cursor,
                statement,
                parameters,
                context,
                executemany
            ):
            self._publisher.publish_sql(
                id(context),
                {
                    'request_id': self._get_current_request_id(),
                    'statement': statement,
                    'parameters': parameters,
                }
            )

        @event.listens_for(Engine, 'after_cursor_execute')
        def after_cursor_execute(
                conn,
                cursor,
                statement,
                parameters,
                context,
                executemany
            ):
            self._publisher.publish_sql(
                id(context),
                {
                    'request_id':self._get_current_request_id(),
                    'statement':statement,
                    'parameters':parameters,
                    'row_count':None,
                    'result_size':None,
                }
            )

    def _get_current_request_id(self):
        if self._request_profiler:
            return self._request_profiler.get_current_id()
