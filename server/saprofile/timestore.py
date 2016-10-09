"""
Data store for anything used for by CP-SA-profiler
"""
import time


class TimeStore(object):
    def __init__(self):
        self._store = {}
        self._last_cleanup = 0

    def update(self, id, data):
        if id not in self._store:
            self._store[id] = {
                'id': id,
                'data': data,
                'created': time.time(),
                'updated': time.time(),
            }
        else:
            self._store[id]['data'] = self._update_data(self._store[id]['data'], data)
            self._store[id]['updated'] = time.time()
        # Return whatever the latest version of the record is
        return self._store[id]

    def _update_data(self, store, new_data):
        raise Exception('You must implement _update_data!')

    def get_ids(self):
        return self._store.keys()

    def get(self, id):
        return self._store.get(id)

    def periodic_cleanup(self, cleanup_frequency_s=60):
        if time.time() > self._last_cleanup + cleanup_frequency_s:
            self.cleanup()

    def old_keys(self, max_age_s=10*60):
        """
        Find any keys which haven't been updated for max_age_ms
        """
        minimum_updated = time.time() - max_age_s
        return (
            k
            for k, v in self._store.iterkeys()
            if v['updated'] < minimum_updated
        )

    def cleanup(self, max_age_s=10*60):
        """
        Remove any records which haven't been updated for max_age_ms
        """
        self._last_cleanup = time.time()
        for k in self.old_keys(max_age_s):
            del self._store[k]


class DictTimeStore(TimeStore):
    def _update_data(self, old_data, new_data):
        old_data.update(new_data)
        return old_data


class ListTimeStore(TimeStore):
    def _update_data(self, old_data, new_data):
        old_data.append(new_data)
        return old_data


class ListQueueTimeStore(ListTimeStore):
    def get(self, id):
        data = super(self, ListQueueTimeStore).get(id)
        self._store[id]['data'] = []
        return self._store.get(id)
