import logging

from .timestore import DictTimeStore, ListTimeStore

logger = logging.getLogger(__name__)


class Publisher(object):
    def __init__(self):
        self._sql_store = DictTimeStore('sql')
        self._request_store = DictTimeStore('request')
        self._client_store = ListTimeStore('client')

    def publish_sql(self, id, data):
        self._publish(self._sql_store, id, data)

    def publish_request(self, id, data):
        self._publish(self._request_store, id, data)

    def _publish(self, store, id, data):
        logger.debug('Publish...')

        # Update the store
        full_data = store.update(id, data)

        # Publish the given message to all clients
        for client_id in self._client_store.get_ids():
            logger.debug('Publish: {id}'.format(id=client_id))
            self._client_store.update(client_id, full_data)

        # Cleanup the store
        store.periodic_cleanup()

    def add_client(self, id):
        self._client_store.update(id, [])

    def get_client_data(self, client_id):
        if not self._client_store.has(client_id):
            # This is a new client; add them to the client list & give them all our current data
            sql_data = self._sql_store.get_all()
            request_data = self._request_store.get_all()
            self._client_store.update(client_id, sql_data + request_data)
        return self._client_store.pop_data(client_id)
