/*global $*/

function add_events(target, event_list) {
    // Event system
    var events = {};
    event_list.forEach(function(event) {
        events[event] = $.Callbacks();
    });
    target.prototype.publish = function(event, data) {
        events[event].fire(data);
    };
    target.prototype.subscribe = function(event, callback) {
        events[event].add(callback);
    };
    target.prototype.unsubscribe = function(event, callback) {
        events[event].remove(callback);
    };
}


function CPSAClient() {
    this._client_id = undefined;

    this._fetch_data = function() {
        if (this.is_running()) {
            $.getJSON(
                'data',
                {id: this._client_id},
                this._parse_data
            );
        }
    }.bind(this);

    this._parse_data = function(data, textStatus, jqXHR) {
        if (data) {
            data.forEach(function(record) {
                this.publish('newRecord', record);
            }.bind(this));
        }
        setTimeout(this._fetch_data, 1000);
    }.bind(this);

    this.is_running = function() {
        return this._client_id !== undefined;
    }.bind(this);

    this.start = function() {
        if (this.is_running()) {
            console.log('Start failed - already started!');
            return;
        }

        // Register a new client & start recording
        $.getJSON(
            'register',
            {
                'include_existing_data': true
            },
            function(data, textStatus, jqXHR) {
                this._client_id = data;
                this.publish('start');
                this._fetch_data();
            }.bind(this)
        );
    }.bind(this);

    this.stop = function() {
        if (!this.is_running()) {
            console.log('Stop failed - not started!');
            return;
        }

        // Unregister myself & stop recording
        $.getJSON(
            'unregister',
            {id: this._client_id},
            function(data, textStatus, jqXHR) {
                this._client_id = undefined;
                this.publish('stop');
            }.bind(this)
        );
    }.bind(this);
}
add_events(CPSAClient, ['start', 'stop', 'newRecord']);

function CPSADataStore() {
    this._store = {
        sql: {},
        request: {}
    };

    this._on_newRecord = function(record) {
        if (this._store[record.type][record.id] === undefined) {
            // This record is new, just add it
            this._store[record.type][record.id] = record;
            this.publish('add', record);
        } else {
            // Check this record is newer than the one we currently have
            if (record.updated < this._store[record.type][record.id].updated) {
                this._store[record.type][record.id] = record;
                this.publish('update', record);
            }
        }
    }.bind(this);

    this.listen = function(cpsa_client) {
        cpsa_client.subscribe('newRecord', this._on_newRecord);
    }.bind(this);

    this.clear = function() {
        Object.keys(this._store).forEach(function(key) {
            this._store[key] = {};
        }.bind(this));
        this.publish('clear');
    }.bind(this);

    this.get = function(type, id) {
        return this._store[type][id];
    }.bind(this);

    this.get_all = function(type) {
        return this._store[type];
    }.bind(this);
}
add_events(CPSADataStore, ['add', 'update', 'clear']);

var cpsa_client = new CPSAClient(),
    cpsa_datastore = new CPSADataStore();

cpsa_datastore.listen(cpsa_client);

$(function() {
    $('#start').click(cpsa_client.start);
    $('#stop').click(cpsa_client.stop);
    $('#clear').click(cpsa_datastore.clear);

    cpsa_client.subscribe('start', function() {
        console.log('start');
        $('#start').prop("disabled", true);
        $('#stop').prop("disabled", false);
    });

    cpsa_client.subscribe('stop', function() {
        console.log('stop');
        $('#start').prop("disabled", false);
        $('#stop').prop("disabled", true);
    });

    cpsa_datastore.subscribe('clear', function() {
        console.log('clear');
        $('#clear').prop("disabled", true);
    });

    cpsa_datastore.subscribe('add', function(data) {
        console.log('add');
        console.log(data);
        $('#clear').prop("disabled", false);
    });

    cpsa_datastore.subscribe('update', function(data) {
        console.log('update');
        console.log(data);
    });
});

/*
Display modes:
* Requests
  * Expand to see SQL
* SQL
* Grouped SQL
*/