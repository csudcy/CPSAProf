"""
Data store for anything used for by CP-SA-profiler
"""
import logging
import time

logger = logging.getLogger(__name__)


class TimeStore(object):
    def __init__(self, type, cleanup_frequency_s=60, max_age_s=10*60):
        self._type = type
        self._cleanup_frequency_s = cleanup_frequency_s
        self._max_age_s = max_age_s
        self._store = {}
        self._last_cleanup = 0

    def update(self, id, data):
        if id not in self._store:
            # New record; add it
            self._store[id] = {
                'id': id,
                'type': self._type,
                'data': data,
                'created': time.time(),
                'updated': time.time(),
            }
        else:
            # Existing record; update it
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

    def get_all(self):
        return self._store.values()

    def has(self, id):
        return id in self._store

    def remove(self, id):
        del self._store[id]

    def periodic_cleanup(self):
        if time.time() > self._last_cleanup + self._cleanup_frequency_s:
            self.cleanup()

    def old_keys(self):
        """
        Find any keys which haven't been updated recently
        """
        minimum_updated = time.time() - self._max_age_s
        return [
            k
            for k, v in self._store.iteritems()
            if v['updated'] < minimum_updated
        ]

    def cleanup(self):
        """
        Remove any records which haven't been updated recently
        """
        self._last_cleanup = time.time()
        for k in self.old_keys():
            self.remove(k)


class DictTimeStore(TimeStore):
    def _update_data(self, old_data, new_data):
        old_data.update(new_data)
        return old_data


class ListTimeStore(TimeStore):
    def _update_data(self, old_data, new_data):
        old_data.append(new_data)
        return old_data

    def pop_data(self, id):
        if id in self._store:
            data = self._store[id]['data']
            self._store[id]['data'] = []
            return data
