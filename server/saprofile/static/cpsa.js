/*global $*/

// Object.values shim
if (Object.values === undefined) {
    Object.values = function(obj) {
        var keys = Object.keys(obj),
            length = keys.length,
            values = Array(length);
        for (var i=0; i<length; i++) {
            values[i] = obj[keys[i]];
        }
        return values;
    };
}


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
        // Add calculated fields
        record.duration = record.updated - record.created;
        record.order = null;
        record.relative_created = null;

        if (this._store[record.type][record.id] === undefined) {
            this._add_record(record);
        } else {
            this._update_record(record);
        }
    }.bind(this);

    this._add_record = function(record) {
        // record.order = Object.keys(this._store[record.type]).length + 1;
        this._store[record.type][record.id] = record;
        console.log('add', record.id, record.order);
        this.publish('add_' + record.type, record);
        this._update_orders(record.type);
    }.bind(this);

    this._update_record = function(record) {
        // Check this record is newer than the one we currently have
        if (record.updated >= this._store[record.type][record.id].updated) {
            return;
        }
        // record.order = this._store[record.type][record.id].order;
        this._store[record.type][record.id] = record;
        console.log('update', record.id, record.order);
        this.publish('update_' + record.type, record);
        this._update_orders(record.type);
    }.bind(this);

    this._update_orders = function(type) {
        // Update the order attibute of all rows
        console.log('_update_orders', type);
        var records = Object.values(this._store[type]);
        records.sort(function (a, b){
            return a.created - b.created;
        });
        var min_created = records[0].created;
        records.forEach(function(record, index) {
            var order = index + 1,
                relative_created = record.created - min_created;
            if (record.order !== order || record.relative_created !== relative_created) {
                // console.log('Order update', record.order, order);
                record.order = order;
                record.relative_created = relative_created;
                this.publish('update_' + type, record);
            }
        }.bind(this));
        records.forEach(function(record, index) {
            console.log(index, record.id, record.order, record.relative_created);
        });
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
        return Object.values(this._store[type]);
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

    this._on_add_or_update_sql = function(record) {
        // Only add records when they are complete i.e. when updated > created
        if (record.duration === 0) {
            if (this._aggregated_ids[record.id] !== undefined) {
                console.log('Updated SQL record has already been aggregated:', record);
            } else {
                // Add this record to our aggregated store now
                console.log('Aggregating SQL record:', record);
                this._aggregated_ids[record.id] = true;
                // TODO: Aggregate record
            }
        } else {
            console.log('Unfinished SQL record ignored:', record);
        }
    }.bind(this);

    this._on_clear = function() {
        this._store = {};
        this.publish('clear');
    }.bind(this);
}
add_events(CPSASqlAggregator, ['add', 'update', 'clear']);


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
        this._datatable.row('#' + data.id).data(data);
        this._datatable.draw();
    }.bind(this);

    this._on_clear = function() {
        this._datatable.clear();
        this._datatable.draw();
    }.bind(this);

    this.display = function(container) {
        function nice_duration_seconds(seconds) {
            return (Math.floor(seconds * 100) / 100.0) + 's';
        }
        this._container = container;
        this._datatable = this._container.DataTable({
            data: this._cpsa_datastore.get('sql'),
            rowId: 'id',
            autoWidth: true,
            order: [[0, 'desc']],
            columns: [
                {
                    title: 'Index',
                    data: 'order'
                },
                {
                    title: 'Id',
                    data: 'id'
                },
                {
                    title: 'Created',
                    data: 'relative_created',
                    render: {display: nice_duration_seconds}
                },
                {
                    title: 'Duration',
                    data: 'duration',
                    render: {display: nice_duration_seconds}
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
