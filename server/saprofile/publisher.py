import logging
import random

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

    def add_client(self, include_existing_data=False):
        client_id = unicode(random.randint(1, 999999))
        initial_data = []
        if include_existing_data:
            initial_data += self._sql_store.get_all()
            initial_data += self._request_store.get_all()
        self._client_store.update(client_id, initial_data)
        return client_id

    def remove_client(self, client_id):
        self._client_store.remove(client_id)

    def get_client_data(self, client_id):
        return self._client_store.pop_data(client_id)
