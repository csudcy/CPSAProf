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
                this.publish('new_record', record);
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
add_events(CPSAClient, ['start', 'stop', 'new_record']);

function CPSADataStore() {
    this._store = {
        sql: {},
        request: {}
    };

    this._on_new_record = function(record) {
        if (this._store[record.type][record.id] === undefined) {
            // This record is new, just add it
            this._store[record.type][record.id] = record;
            this.publish('add_' + record.type, record);
        } else {
            // Check this record is newer than the one we currently have
            if (record.updated < this._store[record.type][record.id].updated) {
                this._store[record.type][record.id] = record;
                this.publish('update_' + record.type, record);
            }
        }
    }.bind(this);

    this.listen = function(cpsa_client) {
        cpsa_client.subscribe('new_record', this._on_new_record);
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
add_events(CPSADataStore, ['add_sql', 'add_request', 'update_sql', 'update_request', 'clear']);


function CPSASqlAggregator() {
    this._store = {};
    this._aggregated_ids = {};

    this.listen = function(cpsa_datastore) {
        cpsa_datastore.subscribe('add_sql', this._on_add_or_update_sql);
        cpsa_datastore.subscribe('update_sql', this._on_add_or_update_sql);
        cpsa_datastore.subscribe('clear', this._on_clear);
    }.bind(this);

    this._on_add_or_update_sql = function(data) {
        // Only add records when they are complete i.e. when updated > created
        if (data.updated > data.created) {
            if (this._aggregated_ids[data.id] !== undefined) {
                console.log('Updated SQL record has already been aggregated:', data);
            } else {
                // Add this record to our aggregated store now
                console.log('Aggregating SQL record:', data);
                this._aggregated_ids[data.id] = true;
                // TODO: Aggregate data
            }
        } else {
            console.log('Unfinished SQL record ignored:', data);
        }
    }.bind(this);

    this._on_clear = function() {
        this._store = {};
        this._publish('clear');
    }.bind(this);
}


function CPSASqlView() {
    this._container = undefined;
    this._datatable = undefined;

    this.listen = function(cpsa_datastore) {
        this._cpsa_datastore = cpsa_datastore;
        cpsa_datastore.subscribe('add_sql', this._on_add_sql);
        cpsa_datastore.subscribe('update_sql', this._on_update_sql);
        cpsa_datastore.subscribe('clear', this._on_clear);
    }.bind(this);

    this._on_add_sql = function(data) {
        this._datatable.row.add(data);
        this._datatable.draw();
    }.bind(this);

    this._on_update_sql = function(data) {
        console.log('TODO: _on_update_sql');
        this._datatable.row(data.id).data(data);
        this._datatable.draw();
    }.bind(this);

    this._on_clear = function() {
        this._datatable.clear();
        this._datatable.draw();
    }.bind(this);

    this.display = function(container) {
        this._container = container;
        this._datatable = this._container.DataTable({
            data: this._cpsa_datastore.get('sql'),
            rowId: 'id',
            autoWidth: true,
            order: [[0, 'desc']],
            columns: [
                {
                    title: 'Index',
                    render: function(data, type, row, meta) {
                        if (type == 'type') {
                            return 'integer';
                        }
                        return meta.row;
                    }
                },
                {
                    title: 'Query',
                    data: 'data.statement'
                },
                {
                    title: 'Parameters',
                    data: 'data.parameters[, ]'
                },
                {
                    title: 'Duration',
                    render: function(data, type, row, meta) {
                        var duration = row.updated - row.created;
                        if (type == 'type') {
                            return 'float';
                        }
                        if (type == 'filter' || type == 'sort') {
                            return duration;
                        }
                        return duration + 'ms';
                    }
                },
                {
                    title: 'Request',
                    data: 'data.request_id'
                },
            ]
        });
    }.bind(this);

    this.remove = function() {
        // this._container.DataTable('destroy');
        this._datatable.destroy();
        this._container = undefined;
    }.bind(this);
}


var cpsa_client = new CPSAClient(),
    cpsa_datastore = new CPSADataStore(),
    cpsa_sql_aggregator = new CPSASqlAggregator(),
    cpsa_sql_view = new CPSASqlView();

cpsa_datastore.listen(cpsa_client);
// cpsa_sql_aggregator.listen(cpsa_datastore);
cpsa_sql_view.listen(cpsa_datastore);

$(function() {
    $('#start').click(cpsa_client.start);
    $('#stop').click(cpsa_client.stop);
    $('#clear').click(cpsa_datastore.clear);

    cpsa_client.subscribe('start', function() {
        $('#start').prop("disabled", true);
        $('#stop').prop("disabled", false);
    });

    cpsa_client.subscribe('stop', function() {
        $('#start').prop("disabled", false);
        $('#stop').prop("disabled", true);
    });

    cpsa_datastore.subscribe('clear', function() {
        $('#clear').prop("disabled", true);
    });

    cpsa_datastore.subscribe('add_sql', function(data) {
        $('#clear').prop("disabled", false);
    });

    cpsa_datastore.subscribe('add_request', function(data) {
        $('#clear').prop("disabled", false);
    });

    cpsa_sql_view.display($('#container'));
});
