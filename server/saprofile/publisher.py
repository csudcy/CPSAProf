from .timestore import DictTimeStore, ListQueueTimeStore


class Publisher(object):
    def __init__(self):
        # self._publisher = Publisher()
        self._sql_store = DictTimeStore()
        self._request_store = DictTimeStore()
        self._client_store = ListQueueTimeStore()

    def publish_sql(self, id, data):
        self._publish(self._sql_store, id, data)

    def publish_request(self, id, data):
        self._publish(self._request_store, id, data)

    def _publish(self, store, id, data):
        # Update the store
        full_data = store.update(id, data)

        # Publish the given message to all clients
        for id in self._client_store.get_ids():
            self._client_store.update(id, data)

        # Cleanup the store
        store.periodic_cleanup()

    def add_client(self, id):
        self._client_store.update(id, [])

    def get_client_data(self, id):
        return self._client_store.get(id)
